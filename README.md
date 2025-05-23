# 500228-wongnok-recipes
------------------ ขั้นตอนการติดตั้ง Libraries และ Dependencies ------------------

------------------ ฝั่ง Frontend: React (client/) ------------------
1. สร้างโปรเจกต์ React
	npm init
    npx create-react-app client
2. ติดตั้งไลบรารีเพิ่มเติม 
	cd client
    npm install react-router-dom react-select
    หมายเหตุ:
    •	react-router-dom: สำหรับ routing
    •	react-select: สำหรับ dropdown แบบ custom เช่น ความยาก

------------------ ฝั่ง Backend: Node.js + Express + PostgreSQL (server/) ------------------
1. ติดตั้ง Node.js ในเครื่อง
	https://nodejs.org/
2. สร้างโฟลเดอร์ backend
    mkdir server
    cd server
    npm init -y
3. ติดตั้ง dependencies
    npm install express pg cors bcrypt
    หมายเหตุ:
    •	express: สร้าง backend API
    •	pg: เชื่อมต่อ PostgreSQL
    •	cors: เปิดให้ React เรียก API ได้
    •	bcrypt: เข้ารหัส password
4. เพิ่ม dev tool (ถ้าต้องการ)
    npm install -D nodemon

------------------ PostgreSQL (Database) ------------------
1. ติดตั้ง PostgreSQL ในเครื่อง
	https://www.postgresql.org/
	โดยใช้ password : DevPool
2. เปิดโปรแกรม pgadmin4 
    สร้าง Database ชื่อ DevTest
    สร้าง Table โดยใช้คำสั่ง SQL ดังนี้
    CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE recipes (
    recipe_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    name TEXT,
    image_url TEXT,
    ingredients TEXT,
    steps TEXT,
    duration TEXT,
    difficulty TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE ratings (
    rating_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    recipe_id INTEGER REFERENCES recipes(recipe_id),
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
    );

------------------ ไฟล์ Configuration ที่สำคัญและการตั้งค่า ------------------
1. การตั้งค่าสำหรับ Postgres:
    const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'DevTest',
    password: 'DevPool',
    port: 5432,
    };

------------------ วิธีการเริ่มต้น (Start) ระบบ ------------------
1. Backend
    cd server
    node index.js
    จะได้ Server is running at http://localhost:5000

2. Frontend
    cd client
    npm start
    จะได้ http://localhost:3000
