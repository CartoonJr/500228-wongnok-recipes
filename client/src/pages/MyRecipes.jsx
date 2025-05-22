// pages/MyRecipes.jsx
// Import โมดูลที่จำเป็น
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // เพิ่ม Link สำหรับกรณีไม่มีสูตรอาหาร

// ค่าคงที่สำหรับรูปภาพ Placeholder
const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/300x180/E2E8F0/A0AEC0?text=ไม่มีรูปภาพ';

// คอมโพเนนต์สำหรับแสดงรายการสูตรอาหารของผู้ใช้
const MyRecipes = ({ recipes = [], user, fetchRecipes, apiBaseUrl }) => {
  const navigate = useNavigate();
  // State สำหรับจัดการข้อผิดพลาดในการลบ
  const [deleteError, setDeleteError] = useState(null);
  // State สำหรับ ID ของสูตรที่กำลังจะลบ (เพื่อแสดง loading state บนปุ่มนั้นๆ)
  const [deletingId, setDeletingId] = useState(null);


  // ฟังก์ชันสำหรับจัดการการลบสูตรอาหาร
  const handleDelete = async (recipeIdToDelete) => {
    // แสดง dialog ยืนยันการลบ (สามารถเปลี่ยนเป็น Modal ที่สวยงามกว่าได้ในอนาคต)
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสูตรนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;

    setDeletingId(recipeIdToDelete); // ตั้งค่า ID ที่กำลังลบ
    setDeleteError(null); // ล้างข้อผิดพลาดเก่า

    try {
      // ส่ง request ไปยัง API เพื่อลบสูตรอาหาร
      // Backend คาดหวัง user_id_deleter ใน body
      const response = await fetch(`${apiBaseUrl}/recipes/${recipeIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // อาจจะต้องมีการส่ง Token สำหรับ Authentication ในอนาคต
          // 'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ user_id_deleter: user.user_id }) // ส่ง user_id ของผู้ทำการลบ
      });

      if (response.ok) {
        alert('✅ ลบสูตรเรียบร้อยแล้ว');
        if (fetchRecipes) {
          fetchRecipes(); // เรียกฟังก์ชัน fetchRecipes จาก App component เพื่อโหลดข้อมูลใหม่
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'เกิดข้อผิดพลาดในการลบสูตร';
        console.error('Delete error:', errorMessage);
        setDeleteError(errorMessage);
        alert(`❌ ลบสูตรไม่สำเร็จ: ${errorMessage}`);
      }
    } catch (err) {
      console.error('เกิดข้อผิดพลาดขณะเชื่อมต่อเพื่อลบ:', err);
      setDeleteError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setDeletingId(null); // ล้าง ID ที่กำลังลบ
    }
  };

  // หากผู้ใช้ยังไม่มีสูตรอาหาร
  if (!recipes || recipes.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>คุณยังไม่มีสูตรอาหารที่สร้างไว้</p>
        <Link to="/create" className="btn-submit" style={{marginTop: '1rem', display: 'inline-block'}}>
          สร้างสูตรอาหารใหม่
        </Link>
      </div>
    );
  }

  // ส่วน UI ของคอมโพเนนต์
  return (
    <div>
      <h2 style={{ textAlign: 'center', margin: '1.5rem 0' }}>สูตรอาหารของฉัน ({recipes.length})</h2>
      {deleteError && <p className="error-msg" style={{textAlign: 'center', marginBottom: '1rem'}}>⚠️ {deleteError}</p>}
      <div className="recipe-grid">
        {/* วนลูปแสดงการ์ดสูตรอาหารแต่ละรายการของผู้ใช้ */}
        {recipes.map((recipe) => (
          <div key={recipe.recipe_id} className="recipe-card">
            <img
              src={recipe.image_url || PLACEHOLDER_IMAGE_URL}
              alt={`รูปภาพของ ${recipe.name}`}
              className="recipe-img"
              onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE_URL; }}
            />
            <div className="recipe-content">
              <h3 className="recipe-title" title={recipe.name}>{recipe.name}</h3>
              <p className="recipe-sub">⏱ {recipe.duration || 'N/A'} | 🎯 {recipe.difficulty || 'N/A'}</p>
              <p className="recipe-rating">
                ⭐ {recipe.average_rating ? Number(recipe.average_rating).toFixed(1) : 'ยังไม่มีคะแนน'}
                <span style={{ fontSize: '0.8rem', color: '#A0AEC0', marginLeft: '0.3rem' }}>
                  ({recipe.review_count > 0 ? `${recipe.review_count} รีวิว` : 'ยังไม่มีรีวิว'})
                </span>
              </p>
              {/* ส่วนของปุ่มดำเนินการ (ดู, แก้ไข, ลบ) */}
              <div className="detail-actions" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                <button
                  onClick={() => navigate(`/recipe/${recipe.recipe_id}`)}
                  className="btn-view" // Class ใหม่สำหรับปุ่มดู
                  title="ดูรายละเอียดสูตร"
                >
                  👁️ ดู
                </button>
                <button
                  onClick={() => navigate(`/edit/${recipe.recipe_id}`)}
                  className="btn-edit"
                  title="แก้ไขสูตร"
                >
                  ✏️ แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(recipe.recipe_id)}
                  className="btn-delete" // ใช้ class ที่ถูกต้อง
                  disabled={deletingId === recipe.recipe_id} // Disable ปุ่มขณะกำลังลบสูตรนี้
                  title="ลบสูตร"
                >
                  {deletingId === recipe.recipe_id ? 'กำลังลบ...' : '🗑️ ลบ'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyRecipes;
