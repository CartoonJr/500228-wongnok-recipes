// index.js
// Import โมดูลที่จำเป็น
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // เปลี่ยนจาก Client เป็น Pool เพื่อการจัดการ connection ที่ดีขึ้น
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// การตั้งค่าการเชื่อมต่อ PostgreSQL โดยใช้ Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'DevTest',
  password: 'DevPool',
  port: 5432,
});

// Middleware สำหรับจัดการข้อผิดพลาดแบบรวมศูนย์
const errorHandler = (err, req, res, next) => {
  console.error('เกิดข้อผิดพลาด:', err.message || err); // แสดงข้อผิดพลาดใน console
  // ตรวจสอบประเภทของข้อผิดพลาดเพื่อส่ง status code ที่เหมาะสม
  if (err.code === '23505') { // Unique violation (เช่น username/email ซ้ำ)
    return res.status(409).json({ error: err.customMessage || 'ข้อมูลนี้มีอยู่ในระบบแล้ว' });
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
};

// Helper function สำหรับการ query ฐานข้อมูล
const queryDatabase = async (sql, params) => {
  const client = await pool.connect(); // ดึง connection จาก pool
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release(); // คืน connection กลับไปยัง pool
  }
};

// --- Routes ---

// Route: ลงทะเบียนผู้ใช้ใหม่
app.post('/api/register', async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    // สร้าง Error object พร้อม custom message และ status code
    const err = new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
    err.statusCode = 400;
    return next(err); // ส่งต่อไปยัง error handler
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    await queryDatabase(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
      [username, email, password_hash]
    );
    res.status(201).json({ message: 'ลงทะเบียนผู้ใช้สำเร็จ' });
  } catch (err) {
    if (err.code === '23505') {
      err.customMessage = 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว';
    }
    next(err); // ส่งต่อไปยัง error handler
  }
});

// Route: เข้าสู่ระบบ
app.post('/api/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const err = new Error('กรุณากรอกอีเมลและรหัสผ่าน');
    err.statusCode = 400;
    return next(err);
  }

  try {
    const result = await queryDatabase('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      const err = new Error('อีเมลไม่ถูกต้อง');
      err.statusCode = 401;
      return next(err);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('รหัสผ่านไม่ถูกต้อง');
      err.statusCode = 401;
      return next(err);
    }

    res.json({ user: { user_id: user.user_id, username: user.username, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// Route: ส่ง/อัปเดตคะแนนสูตรอาหาร
app.post('/api/ratings', async (req, res, next) => {
  const { recipe_id, user_id, score } = req.body;

  if (recipe_id === undefined || user_id === undefined || score === undefined) {
    const err = new Error('ข้อมูลสำหรับให้คะแนนไม่ครบถ้วน');
    err.statusCode = 400;
    return next(err);
  }
  if (typeof score !== 'number' || score < 1 || score > 5) {
     const err = new Error('คะแนนต้องเป็นตัวเลขระหว่าง 1 ถึง 5');
     err.statusCode = 400;
     return next(err);
  }


  try {
    const ownerCheckResult = await queryDatabase(
      'SELECT user_id FROM recipes WHERE recipe_id = $1',
      [recipe_id]
    );

    if (ownerCheckResult.rows.length === 0) {
        const err = new Error('ไม่พบสูตรอาหารที่ต้องการให้คะแนน');
        err.statusCode = 404;
        return next(err);
    }
    const owner_id = ownerCheckResult.rows[0]?.user_id;

    if (owner_id === user_id) {
      const err = new Error('ไม่สามารถให้คะแนนสูตรของตัวเองได้');
      err.statusCode = 403;
      return next(err);
    }

    await queryDatabase(`
      INSERT INTO ratings (recipe_id, user_id, score)
      VALUES ($1, $2, $3)
      ON CONFLICT (recipe_id, user_id)
      DO UPDATE SET score = EXCLUDED.score
    `, [recipe_id, user_id, score]);

    res.status(201).json({ message: 'ส่งคะแนนเรียบร้อย' });
  } catch (err) {
    next(err);
  }
});

// Route: ดึงข้อมูลสูตรอาหารทั้งหมด
app.get('/api/recipes', async (req, res, next) => {
  try {
    const result = await queryDatabase(`
      SELECT
        r.*,
        u.username,
        ROUND(AVG(rt.score), 1) AS average_rating,
        COUNT(rt.score) AS review_count
      FROM recipes r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id
      GROUP BY r.recipe_id, u.username
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    err.message = 'ไม่สามารถดึงข้อมูลสูตรอาหารได้'; // กำหนด custom message สำหรับ error handler
    next(err);
  }
});

// Route: ดึงข้อมูลสูตรอาหารตาม ID
app.get('/api/recipes/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await queryDatabase(`
      SELECT r.*, u.username, ROUND(AVG(rt.score), 1) AS average_rating, COUNT(rt.score) AS review_count
      FROM recipes r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id
      WHERE r.recipe_id = $1
      GROUP BY r.recipe_id, u.username
    `, [id]);

    if (result.rows.length === 0) {
      const err = new Error('ไม่พบสูตรอาหาร');
      err.statusCode = 404;
      return next(err);
    }
    res.json(result.rows[0]);
  } catch (err) {
    err.message = 'ไม่สามารถดึงข้อมูลรายละเอียดสูตรอาหารได้';
    next(err);
  }
});

// Route: เพิ่มสูตรอาหารใหม่
app.post('/api/recipes', async (req, res, next) => {
  const { name, image_url, ingredients, steps, duration, difficulty, user_id } = req.body;

  if (!name || !ingredients || !steps || !duration || !difficulty || user_id === undefined) {
    const err = new Error('กรอกข้อมูลไม่ครบถ้วน');
    err.statusCode = 400;
    return next(err);
  }

  try {
    await queryDatabase(
      `INSERT INTO recipes (name, image_url, ingredients, steps, duration, difficulty, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [name, image_url || null, ingredients, steps, duration, difficulty, user_id] // ให้ image_url เป็น null ถ้าไม่มีค่า
    );
    res.status(201).json({ message: 'เพิ่มสูตรเรียบร้อยแล้ว' });
  } catch (err) {
    err.message = 'ไม่สามารถเพิ่มสูตรได้';
    next(err);
  }
});

// Route: แก้ไขสูตรอาหารตาม ID
app.put('/api/recipes/:id', async (req, res, next) => {
  const { id } = req.params;
  const { name, image_url, ingredients, steps, duration, difficulty, user_id_editor } = req.body; // เพิ่ม user_id_editor เพื่อตรวจสอบสิทธิ์

  // ตรวจสอบว่ามีข้อมูลที่จำเป็นสำหรับการอัปเดตหรือไม่
  if (!name && !image_url && !ingredients && !steps && !duration && !difficulty) {
      const err = new Error('ไม่มีข้อมูลสำหรับการอัปเดต');
      err.statusCode = 400;
      return next(err);
  }
  if (user_id_editor === undefined) {
    const err = new Error('ไม่พบข้อมูลผู้แก้ไข');
    err.statusCode = 400;
    return next(err);
  }

  try {
    // ตรวจสอบสิทธิ์ก่อนการแก้ไข
    const recipeCheck = await queryDatabase('SELECT user_id FROM recipes WHERE recipe_id = $1', [id]);
    if (recipeCheck.rows.length === 0) {
        const err = new Error('ไม่พบสูตรอาหารที่ต้องการแก้ไข');
        err.statusCode = 404;
        return next(err);
    }
    if (recipeCheck.rows[0].user_id !== user_id_editor) {
        const err = new Error('คุณไม่มีสิทธิ์แก้ไขสูตรอาหารนี้');
        err.statusCode = 403;
        return next(err);
    }

    // ดึงข้อมูลปัจจุบันของสูตรอาหาร
    const currentRecipeResult = await queryDatabase('SELECT * FROM recipes WHERE recipe_id = $1', [id]);
    const currentRecipe = currentRecipeResult.rows[0];

    // สร้าง query สำหรับอัปเดตโดยใช้ข้อมูลใหม่หรือข้อมูลเดิมหากไม่ได้ระบุ
    const updateQuery = `
      UPDATE recipes
      SET name = $1, image_url = $2, ingredients = $3, steps = $4, duration = $5, difficulty = $6
      WHERE recipe_id = $7
    `;
    const values = [
        name !== undefined ? name : currentRecipe.name,
        image_url !== undefined ? image_url : currentRecipe.image_url,
        ingredients !== undefined ? ingredients : currentRecipe.ingredients,
        steps !== undefined ? steps : currentRecipe.steps,
        duration !== undefined ? duration : currentRecipe.duration,
        difficulty !== undefined ? difficulty : currentRecipe.difficulty,
        id
    ];

    await queryDatabase(updateQuery, values);
    res.json({ message: 'อัปเดตสูตรอาหารเรียบร้อย' });
  } catch (err) {
    err.message = 'การอัปเดตล้มเหลว';
    next(err);
  }
});

// Route: ลบสูตรอาหารตาม ID
app.delete('/api/recipes/:id', async (req, res, next) => {
  const { id } = req.params;
  const { user_id_deleter } = req.body; // ผู้ใช้ที่ทำการลบ

   if (user_id_deleter === undefined) {
    const err = new Error('ไม่พบข้อมูลผู้ทำการลบ');
    err.statusCode = 400;
    return next(err);
  }

  try {
     // ตรวจสอบสิทธิ์ก่อนการลบ
    const recipeCheck = await queryDatabase('SELECT user_id FROM recipes WHERE recipe_id = $1', [id]);
    if (recipeCheck.rows.length === 0) {
        const err = new Error('ไม่พบสูตรอาหารที่ต้องการลบ');
        err.statusCode = 404;
        return next(err);
    }
    if (recipeCheck.rows[0].user_id !== user_id_deleter) {
        const err = new Error('คุณไม่มีสิทธิ์ลบสูตรอาหารนี้');
        err.statusCode = 403;
        return next(err);
    }

    // ลบ ratings ที่เกี่ยวข้องก่อน
    await queryDatabase('DELETE FROM ratings WHERE recipe_id = $1', [id]);
    // จากนั้นลบสูตรอาหาร
    await queryDatabase('DELETE FROM recipes WHERE recipe_id = $1', [id]);
    res.json({ message: 'ลบสูตรอาหารเรียบร้อย' });
  } catch (err) {
    err.message = 'ไม่สามารถลบสูตรอาหารได้';
    next(err);
  }
});

// Route: ดึงคะแนนที่ผู้ใช้เคยให้สำหรับสูตรอาหาร
app.get('/api/ratings/:recipe_id/:user_id', async (req, res, next) => {
  const { recipe_id, user_id } = req.params;
  try {
    const result = await queryDatabase(
      'SELECT score FROM ratings WHERE recipe_id = $1 AND user_id = $2',
      [recipe_id, user_id]
    );
    if (result.rows.length > 0) {
      res.json({ score: result.rows[0].score });
    } else {
      res.json({ score: null }); // ไม่เคยให้คะแนน
    }
  } catch (err) {
    err.message = 'ไม่สามารถดึงข้อมูลคะแนนได้';
    next(err);
  }
});

// ใช้ error handler middleware เป็นตัวสุดท้าย
app.use(errorHandler);

// เริ่มการทำงานของเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000; // ใช้ PORT จาก environment variable หรือ 5000
app.listen(PORT, () => {
  console.log(`✅ เซิร์ฟเวอร์กำลังทำงานที่ http://localhost:${PORT}`);
});
