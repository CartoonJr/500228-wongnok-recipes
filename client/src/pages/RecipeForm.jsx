// RecipeForm.jsx
// Import โมดูลที่จำเป็น
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreatableSelect from "react-select/creatable"; // สำหรับ Dropdown ที่สร้างตัวเลือกใหม่ได้

// ตัวเลือกเริ่มต้นสำหรับระดับความยาก
const DIFFICULTY_OPTIONS = [
  { value: "ง่าย", label: "ง่าย" },
  { value: "ปานกลาง", label: "ปานกลาง" },
  { value: "ยาก", label: "ยาก" },
];

// ตัวเลือกสำหรับระยะเวลา
const DURATION_OPTIONS = [
  { value: "5-10 นาที", label: "5-10 นาที" },
  { value: "11-30 นาที", label: "11-30 นาที" },
  { value: "31-60 นาที", label: "31-60 นาที" },
  { value: "60 นาทีขึ้นไป", label: "60 นาทีขึ้นไป" },
];

// ค่าเริ่มต้นสำหรับฟอร์ม
const INITIAL_FORM_STATE = {
  name: "",
  image_url: "",
  ingredients: "",
  steps: "",
  duration: "",
};

// คอมโพเนนต์สำหรับฟอร์มเพิ่มสูตรอาหาร
const RecipeForm = ({ user, fetchRecipes, apiBaseUrl }) => {
  // State สำหรับเก็บข้อมูลในฟอร์ม
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  // State สำหรับเก็บระดับความยากที่เลือก (ใช้กับ CreatableSelect)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null); // เปลี่ยนชื่อเป็น selectedDifficulty เพื่อความชัดเจน
  // State สำหรับเก็บข้อความข้อผิดพลาด
  const [error, setError] = useState("");
  // State สำหรับสถานะการโหลด (กำลัง submit)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate(); // Hook สำหรับการ redirect หน้า

  // หากยังไม่ได้ล็อกอิน ให้แสดงข้อความแจ้งเตือนและปุ่มไปหน้าล็อกอิน
  if (!user) {
    return (
      <div className="form-container" style={{ textAlign: 'center' }}>
        <h2>กรุณาเข้าสู่ระบบ</h2>
        <p>คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถเพิ่มสูตรอาหารได้</p>
        <button onClick={() => navigate('/login')} className="btn-submit" style={{ marginTop: '1rem' }}>
          ไปหน้าเข้าสู่ระบบ
        </button>
      </div>
    );
  }

  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงค่าใน input field (ยกเว้น CreatableSelect)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงค่าใน CreatableSelect (difficulty)
  const handleDifficultyChange = (selectedOption) => {
    setSelectedDifficulty(selectedOption);
  };

  // ฟังก์ชันสำหรับจัดการการ submit ฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault(); // ป้องกันการ refresh หน้าเมื่อ submit ฟอร์ม
    setError(""); // ล้างข้อความข้อผิดพลาดเก่า
    setIsSubmitting(true);

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!form.name || !form.ingredients || !form.steps || !form.duration || !selectedDifficulty) {
        setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน: ชื่อเมนู, วัตถุดิบ, ขั้นตอน, ระยะเวลา, และความยาก");
        setIsSubmitting(false);
        alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
        return;
    }

    // เตรียมข้อมูลที่จะส่งไปยัง API
    const payload = {
      ...form,
      difficulty: selectedDifficulty ? selectedDifficulty.value : "", // ดึงค่า value จาก state selectedDifficulty
      user_id: user.user_id, // เพิ่ม user_id ของผู้สร้างสูตร
    };

    try {
      const response = await fetch(`${apiBaseUrl}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ เพิ่มสูตรอาหารเรียบร้อยแล้ว");
        if (fetchRecipes) {
          fetchRecipes(); // เรียกฟังก์ชัน fetchRecipes จาก App component เพื่อโหลดข้อมูลใหม่
        }
        navigate("/my-recipes"); // Redirect ไปยังหน้ารายการสูตรอาหารของผู้ใช้
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการเพิ่มสูตร");
        alert(`เกิดข้อผิดพลาด: ${data.error || "ไม่สามารถเพิ่มสูตรได้"}`);
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการ submit:", err);
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อเพิ่มสูตรได้");
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ส่วน UI ของคอมโพเนนต์
  return (
    <div className="form-container">
      <h2>เพิ่มสูตรอาหารใหม่</h2>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="name">ชื่อเมนู:</label>
          <input
            id="name"
            type="text"
            name="name"
            placeholder="เช่น ข้าวผัดกะเพราหมูกรอบ"
            value={form.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="image_url">ลิงก์รูปภาพ (URL):</label>
          <input
            id="image_url"
            type="url"
            name="image_url"
            placeholder="เช่น https://example.com/image.jpg"
            value={form.image_url}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        {/* แสดงตัวอย่างรูปภาพถ้ามี URL */}
        {form.image_url && (
          <div style={{ margin: "1rem 0", textAlign: "center" }}>
            <img
              src={form.image_url}
              alt="ตัวอย่างรูปภาพ"
              style={{
                maxWidth: "100%",
                maxHeight: "200px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                objectFit: "cover",
              }}
              onError={(e) => { e.target.style.display = 'none'; /* หรือเปลี่ยนเป็น placeholder */ }}
            />
            <p style={{ fontSize: "0.9rem", color: "#666", marginTop: '0.5rem' }}>ตัวอย่างรูปภาพ (หากลิงก์ถูกต้อง)</p>
          </div>
        )}
        <div>
          <label htmlFor="ingredients">วัตถุดิบ (แต่ละรายการขึ้นบรรทัดใหม่):</label>
          <textarea
            id="ingredients"
            name="ingredients"
            placeholder="เช่น&#10;หมูกรอบ 200 กรัม&#10;ใบกะเพรา 1 กำมือ&#10;พริกขี้หนู 5-10 เม็ด"
            value={form.ingredients}
            onChange={handleChange}
            rows={5}
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="steps">ขั้นตอนการทำ (แต่ละขั้นตอนขึ้นบรรทัดใหม่):</label>
          <textarea
            id="steps"
            name="steps"
            placeholder="เช่น&#10;1. ตั้งกระทะ ใส่น้ำมันเล็กน้อย&#10;2. ใส่พริกกระเทียมลงไปผัดให้หอม&#10;3. ใส่หมูกรอบ ผัดให้เข้ากัน"
            value={form.steps}
            onChange={handleChange}
            rows={6}
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="duration">ระยะเวลาเตรียมและปรุง:</label>
          <select
            id="duration"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          >
            <option value="">-- เลือกระยะเวลา --</option>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="difficulty">ระดับความยาก:</label>
          <CreatableSelect
            inputId="difficulty"
            options={DIFFICULTY_OPTIONS}
            onChange={handleDifficultyChange}
            value={selectedDifficulty}
            placeholder="เลือกระดับความยาก หรือพิมพ์เพื่อเพิ่มใหม่..."
            isClearable
            isDisabled={isSubmitting}
            formatCreateLabel={(inputValue) => `เพิ่มระดับความยาก: "${inputValue}"`}
          />
        </div>

        {/* แสดงข้อความข้อผิดพลาด (ถ้ามี) */}
        {error && <p className="error-msg" style={{textAlign: 'center', marginTop: '1rem'}}>⚠️ {error}</p>}

        <button type="submit" className="btn-submit" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
          {isSubmitting ? 'กำลังบันทึกสูตร...' : 'บันทึกสูตรอาหาร'}
        </button>
      </form>
    </div>
  );
};

export default RecipeForm;
