// EditRecipe.jsx
// Import โมดูลที่จำเป็น
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CreatableSelect from "react-select/creatable"; // สำหรับ Dropdown ที่สร้างตัวเลือกใหม่ได้

// ตัวเลือกเริ่มต้นสำหรับระดับความยาก
const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "ง่าย" },
  { value: "Medium", label: "ปานกลาง" },
  { value: "Hard", label: "ยาก" },
];

// ตัวเลือกสำหรับระยะเวลา
const DURATION_OPTIONS = [
  { value: "5-10 mins", label: "5-10 นาที" },
  { value: "11-30 mins", label: "11-30 นาที" },
  { value: "31-60 mins", label: "31-60 นาที" },
  { value: "60+ mins", label: "60 นาทีขึ้นไป" },
];

// ค่าเริ่มต้นสำหรับฟอร์ม
const INITIAL_FORM_STATE = {
  name: "",
  image_url: "",
  ingredients: "",
  steps: "",
  duration: "",
  difficulty: "",
  user_id: null, // จะถูก set จาก props
};

// คอมโพเนนต์สำหรับแก้ไขสูตรอาหาร
const EditRecipe = ({ user, fetchRecipes, apiBaseUrl }) => {
  const { id: recipeId } = useParams(); // ดึงค่า id ของสูตรอาหารจาก URL params และเปลี่ยนชื่อเป็น recipeId
  const navigate = useNavigate(); // Hook สำหรับการ redirect หน้า

  // State สำหรับเก็บข้อมูลในฟอร์มแก้ไข
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  // State สำหรับเก็บค่าที่เลือกใน CreatableSelect (difficulty)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  // State สำหรับจัดการสถานะการโหลดข้อมูลสูตร
  const [isLoading, setIsLoading] = useState(true);
  // State สำหรับจัดการข้อผิดพลาด
  const [error, setError] = useState(null);

  // useEffect hook สำหรับดึงข้อมูลสูตรอาหารที่ต้องการแก้ไข
  useEffect(() => {
    if (!recipeId || !user) {
      // ถ้าไม่มี recipeId หรือ user, ไม่ต้องทำอะไร หรือ redirect
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    fetch(`${apiBaseUrl}/recipes/${recipeId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`ไม่สามารถโหลดข้อมูลสูตรได้: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (user.user_id !== data.user_id) {
          alert("คุณไม่มีสิทธิ์แก้ไขสูตรนี้");
          navigate("/"); // Redirect ไปหน้าแรก
        } else {
          setForm({ ...data, ingredients: data.ingredients || "", steps: data.steps || "" }); // ตั้งค่าข้อมูลในฟอร์ม
          // ตั้งค่า selectedDifficulty สำหรับ CreatableSelect
          const difficultyValue = DIFFICULTY_OPTIONS.find(opt => opt.value === data.difficulty) ||
                                (data.difficulty ? { value: data.difficulty, label: data.difficulty } : null);
          setSelectedDifficulty(difficultyValue);
        }
      })
      .catch((err) => {
        console.error("โหลดสูตรล้มเหลว:", err);
        setError(err.message);
        // alert("เกิดข้อผิดพลาดในการโหลดข้อมูลสูตร");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [recipeId, user, navigate, apiBaseUrl]);

  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงค่าใน input field (ยกเว้น CreatableSelect)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงค่าใน CreatableSelect (difficulty)
  const handleDifficultyChange = (selectedOption) => {
    setSelectedDifficulty(selectedOption);
    setForm((prevForm) => ({
      ...prevForm,
      difficulty: selectedOption ? selectedOption.value : "",
    }));
  };

  // ฟังก์ชันสำหรับจัดการการ submit ฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault(); // ป้องกันการ refresh หน้าเมื่อ submit ฟอร์ม
    setError(null); // ล้างข้อผิดพลาดเก่า

    if (!form.name || !form.ingredients || !form.steps || !form.duration || !form.difficulty) {
        alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน: ชื่อเมนู, วัตถุดิบ, ขั้นตอน, ระยะเวลา, และความยาก");
        return;
    }

    // ข้อมูลที่จะส่งไปแก้ไข ต้องรวม user_id_editor เพื่อให้ backend ตรวจสอบสิทธิ์
    const payload = {
      ...form,
      user_id_editor: user.user_id, // ส่ง user_id ของผู้แก้ไข
    };
    // ไม่จำเป็นต้องส่ง user_id ของเจ้าของสูตรใน payload อีกต่อไป เพราะ backend จะใช้ recipe_id ในการค้นหา

    try {
      const res = await fetch(`${apiBaseUrl}/recipes/${recipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        alert("แก้ไขสูตรเรียบร้อยแล้ว");
        if (fetchRecipes) fetchRecipes(); // สั่งให้โหลดข้อมูลสูตรใหม่ (ถ้ามีการส่ง prop นี้มา)
        navigate(`/recipe/${recipeId}`); // Redirect ไปยังหน้ารายละเอียดสูตรอาหาร
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการแก้ไขสูตร");
        alert(`เกิดข้อผิดพลาด: ${result.error || "ไม่สามารถแก้ไขสูตรได้"}`);
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการ submit:", err);
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อแก้ไขสูตรได้");
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  if (isLoading) {
    return <p className="text-center p-4">กำลังโหลดข้อมูลสูตรอาหาร...</p>;
  }

  if (error && !form.name) { // ถ้ามี error และยังไม่ได้โหลดข้อมูล form เลย
    return <p className="text-center p-4 text-red-500">เกิดข้อผิดพลาด: {error}</p>;
  }

  // ส่วน UI ของคอมโพเนนต์
  return (
    <div className="form-container">
      <h2>แก้ไขสูตรอาหาร</h2>
      {error && <p className="error-msg" style={{textAlign: 'center', marginBottom: '1rem'}}>⚠️ {error}</p>}
      <form className="form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">ชื่อเมนู:</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            aria-describedby="name-error"
          />
        </div>

        <div>
          <label htmlFor="image_url">ลิงก์รูปภาพ (ถ้ามี):</label>
          <input
            id="image_url"
            name="image_url"
            type="url"
            value={form.image_url}
            onChange={handleChange}
            aria-describedby="imageurl-error"
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
              onError={(e) => { e.target.style.display = 'none'; /* ซ่อนถ้าโหลดรูปไม่ได้ */ }}
            />
            <p style={{ fontSize: "0.9rem", color: "#666", marginTop: '0.5rem' }}>ตัวอย่างรูปภาพ</p>
          </div>
        )}

        <div>
          <label htmlFor="ingredients">วัตถุดิบ (แต่ละรายการขึ้นบรรทัดใหม่):</label>
          <textarea
            id="ingredients"
            name="ingredients"
            value={form.ingredients}
            onChange={handleChange}
            rows={5}
            required
            aria-describedby="ingredients-error"
          />
        </div>

        <div>
          <label htmlFor="steps">ขั้นตอนการทำ (แต่ละขั้นตอนขึ้นบรรทัดใหม่):</label>
          <textarea
            id="steps"
            name="steps"
            value={form.steps}
            onChange={handleChange}
            rows={6}
            required
            aria-describedby="steps-error"
          />
        </div>

        <div>
          <label htmlFor="duration">ระยะเวลา:</label>
          <select
            id="duration"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            required
            aria-describedby="duration-error"
          >
            <option value="">-- เลือกระยะเวลา --</option>
            {DURATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="difficulty">ความยาก:</label>
          <CreatableSelect
            inputId="difficulty" // เพิ่ม inputId สำหรับ accessibility
            options={DIFFICULTY_OPTIONS}
            value={selectedDifficulty}
            onChange={handleDifficultyChange}
            isClearable
            placeholder="เลือกระดับความยาก หรือเพิ่มใหม่..."
            formatCreateLabel={(inputValue) => `เพิ่ม "${inputValue}"`}
            aria-describedby="difficulty-error"
          />
        </div>
        <button type="submit" className="btn-submit" style={{ marginTop: '1rem' }}>
          บันทึกการแก้ไข
        </button>
      </form>
    </div>
  );
};

export default EditRecipe;
