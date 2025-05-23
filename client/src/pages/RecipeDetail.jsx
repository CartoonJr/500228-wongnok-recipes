// RecipeDetail.jsx
// Import โมดูลที่จำเป็น
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ค่าคงที่สำหรับรูปภาพ Placeholder
const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/600x400/E2E8F0/A0AEC0?text=ไม่มีรูปภาพ';

// Utility function สำหรับจัดรูปแบบวันที่
const formatDate = (isoDateString) => {
  if (!isoDateString) return 'ไม่ระบุวันที่';
  try {
    const date = new Date(isoDateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'รูปแบบวันที่ไม่ถูกต้อง';
  }
};

// คอมโพเนนต์สำหรับแสดงรายละเอียดสูตรอาหาร
const RecipeDetail = ({ user, apiBaseUrl }) => {
  const { id: recipeId } = useParams(); // ดึงค่า id ของสูตรอาหารจาก URL params
  const navigate = useNavigate(); // Hook สำหรับการ redirect หน้า

  // State สำหรับเก็บข้อมูลสูตรอาหาร
  const [recipe, setRecipe] = useState(null);
  // State สำหรับเก็บคะแนนที่ผู้ใช้ปัจจุบันให้ (ถ้ามี)
  const [currentRating, setCurrentRating] = useState("");
  // State สำหรับตรวจสอบว่าผู้ใช้ปัจจุบันเคยให้คะแนนสูตรนี้หรือยัง
  const [hasRated, setHasRated] = useState(false);
  // State สำหรับจัดการสถานะการโหลด
  const [isLoading, setIsLoading] = useState(true);
  // State สำหรับจัดการข้อผิดพลาด
  const [error, setError] = useState(null);
  // State สำหรับการส่งคะแนน
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
   // State สำหรับการลบ
  const [isDeleting, setIsDeleting] = useState(false);


  // ฟังก์ชันสำหรับดึงข้อมูลสูตรอาหารและคะแนน
  const fetchRecipeDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. ดึงข้อมูลสูตรอาหาร
      const recipeResponse = await fetch(`${apiBaseUrl}/recipes/${recipeId}`);
      if (!recipeResponse.ok) {
        throw new Error(`ไม่สามารถโหลดข้อมูลสูตรได้: ${recipeResponse.status}`);
      }
      const recipeData = await recipeResponse.json();
      setRecipe(recipeData);

      // 2. หากมีผู้ใช้ล็อกอินอยู่ ให้ดึงข้อมูลคะแนนที่ผู้ใช้เคยให้สำหรับสูตรนี้
      if (user && recipeData) { // ตรวจสอบว่ามี recipeData ก่อน
        const ratingResponse = await fetch(`${apiBaseUrl}/ratings/${recipeId}/${user.user_id}`);
        if (ratingResponse.ok) {
          const ratingData = await ratingResponse.json();
          if (ratingData.score !== null) { // Backend ส่ง score: null ถ้าไม่เคยให้
            setCurrentRating(ratingData.score.toString());
            setHasRated(true);
          } else {
            setCurrentRating("");
            setHasRated(false);
          }
        } else {
          console.warn(`ไม่สามารถโหลดคะแนนเดิมได้: ${ratingResponse.status}`);
          setCurrentRating("");
          setHasRated(false);
        }
      }
    } catch (err) {
      console.error("โหลดรายละเอียดสูตรล้มเหลว:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, recipeId, user]);

  useEffect(() => {
    fetchRecipeDetails();
  }, [fetchRecipeDetails]);

  // ฟังก์ชันสำหรับจัดการการส่งคะแนน
  const handleSubmitRating = async () => {
    if (!currentRating || !user || !recipe) {
      alert("กรุณาเลือกคะแนนและตรวจสอบว่าคุณได้เข้าสู่ระบบแล้ว");
      return;
    }
    if (user.user_id === recipe.user_id) {
      alert("คุณไม่สามารถให้คะแนนสูตรอาหารของตัวเองได้");
      return;
    }

    setIsSubmittingRating(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipe.recipe_id,
          user_id: user.user_id,
          score: parseInt(currentRating, 10),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("ส่งคะแนนสำเร็จ!");
        fetchRecipeDetails(); // โหลดข้อมูลใหม่เพื่ออัปเดตคะแนนเฉลี่ยและสถานะการให้คะแนน
      } else {
        setError(data.error || "ไม่สามารถส่งคะแนนได้");
        alert(`เกิดข้อผิดพลาด: ${data.error || "ไม่สามารถส่งคะแนนได้"}`);
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการส่งคะแนน:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อส่งคะแนน");
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // ฟังก์ชันสำหรับจัดการการลบสูตรอาหาร
  const handleDeleteRecipe = async () => {
    if (!recipe || !user || user.user_id !== recipe.user_id) {
      alert("คุณไม่มีสิทธิ์ลบสูตรอาหารนี้");
      return;
    }
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสูตรนี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/recipes/${recipe.recipe_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id_deleter: user.user_id }) // ส่ง user_id ของผู้ทำการลบ
      });

      if (response.ok) {
        alert("ลบสูตรอาหารเรียบร้อยแล้ว");
        navigate("/"); // กลับไปหน้าแรกหลังลบสำเร็จ
      } else {
        const errorData = await response.json();
        setError(errorData.error || "ไม่สามารถลบสูตรอาหารได้");
        alert(`เกิดข้อผิดพลาด: ${errorData.error || "ไม่สามารถลบสูตรอาหารได้"}`);
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการลบสูตร:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบสูตร");
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsDeleting(false);
    }
  };

  // แสดงสถานะการโหลด
  if (isLoading) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>กำลังโหลดรายละเอียดสูตรอาหาร...</p>;
  }
  // แสดงข้อผิดพลาดหากโหลดไม่สำเร็จ
  if (error) {
    return <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>เกิดข้อผิดพลาด: {error}</p>;
  }
  // หากไม่มีข้อมูลสูตร (อาจเกิดจาก ID ไม่ถูกต้อง)
  if (!recipe) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>ไม่พบสูตรอาหารที่คุณต้องการ</p>;
  }

  // ฟังก์ชันช่วยแสดงผลรายการ (วัตถุดิบ, ขั้นตอน)
  const renderListFromString = (text, type) => {
    if (!text || typeof text !== 'string') return <p>ไม่มีข้อมูล{type}</p>;
    return text.split('\n')
      .map((line, idx) => line.trim() && <li key={`${type}-${idx}`}>{line.trim()}</li>)
      .filter(Boolean); // กรองเอาค่า null หรือ empty string ออก
  };


  // ส่วน UI ของคอมโพเนนต์
  return (
    <div className="recipe-detail-card">
      <h2>{recipe.name}</h2>
      <div className="recipe-detail-meta">
        <span>👨‍🍳 โดย: {recipe.username || "ไม่ระบุชื่อผู้สร้าง"}</span>
        <span style={{ marginLeft: "0.75rem" }}>
          • 🕒 เผยแพร่เมื่อ: {formatDate(recipe.created_at)}
        </span>
      </div>
      <p>⏱ ระยะเวลา: {recipe.duration || "N/A"}</p>
      <p>🎯 ความยาก: {recipe.difficulty || "N/A"}</p>
      <p>
        ⭐ คะแนนเฉลี่ย:{" "}
        {recipe.average_rating ? Number(recipe.average_rating).toFixed(1) : "ยังไม่มีคะแนน"}
        <span style={{ fontSize: '0.85rem', color: '#A0AEC0', marginLeft: '0.3rem' }}>
          (จาก {recipe.review_count > 0 ? `${recipe.review_count} รีวิว` : '0 รีวิว'})
        </span>
      </p>

      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={`รูปภาพของ ${recipe.name}`}
          className="recipe-detail-img"
          onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE_URL; }}
        />
      )}

      <div className="recipe-detail-section">
        <h4>วัตถุดิบ:</h4>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
          {renderListFromString(recipe.ingredients, "วัตถุดิบ")}
        </ul>
      </div>

      <div className="recipe-detail-section">
        <h4>ขั้นตอนการทำ:</h4>
        <ol style={{ listStyleType: 'decimal', paddingLeft: '20px' }}>
          {renderListFromString(recipe.steps, "ขั้นตอน")}
        </ol>
      </div>

      {/* ส่วนของการดำเนินการ: แก้ไข/ลบ (สำหรับเจ้าของสูตร) */}
      {user && user.user_id === recipe.user_id && (
        <div className="detail-actions">
          <button
            onClick={() => navigate(`/edit/${recipe.recipe_id}`)}
            className="btn-edit"
            disabled={isDeleting}
          >
            ✏️ แก้ไข
          </button>
          <button
            onClick={handleDeleteRecipe}
            className="btn-delete"
            disabled={isDeleting}
          >
            {isDeleting ? 'กำลังลบ...' : '🗑️ ลบ'}
          </button>
        </div>
      )}

      {/* ส่วนของการให้คะแนน (สำหรับผู้ใช้อื่นที่ล็อกอิน) */}
      {user && user.user_id !== recipe.user_id && (
        <div >
          <h4>ให้คะแนนสูตรนี้:</h4>
          <select
            value={currentRating}
            onChange={(e) => setCurrentRating(e.target.value)}
            disabled={isSubmittingRating}
            aria-label="เลือกคะแนน"
          >
            <option value="">-- เลือกคะแนน --</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {Array(n).fill('⭐').join('')} ({n} ดาว)
              </option>
            ))}
          </select>
          <button
            onClick={handleSubmitRating}
            className="btn-submit"
            disabled={isSubmittingRating || !currentRating}
          >
            {isSubmittingRating ? 'กำลังส่ง...' : (hasRated ? 'แก้ไขคะแนน' : 'ส่งคะแนน')}
          </button>
        </div>
      )}
      {/* แสดงข้อผิดพลาดจากการ submit (ถ้ามี) */}
      {error && <p className="error-msg" style={{textAlign: 'center', marginTop: '1rem'}}>⚠️ {error}</p>}
    </div>
  );
};

export default RecipeDetail;
