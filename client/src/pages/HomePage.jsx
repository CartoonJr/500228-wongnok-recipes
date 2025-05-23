// HomePage.jsx
// Import โมดูลที่จำเป็น
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

// ค่าคงที่สำหรับรูปภาพ Placeholder
const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/300x180/E2E8F0/A0AEC0?text=ไม่มีรูปภาพ'; // ปรับปรุง Placeholder

const formatDate = (isoDateString) => {
  if (!isoDateString) return 'ไม่ระบุวันที่';
  try {
    const date = new Date(isoDateString);
    return date.toLocaleDateString("th-TH", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      // hour: '2-digit', // สามารถเพิ่มเวลาได้ถ้าต้องการ
      // minute: '2-digit',
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'รูปแบบวันที่ไม่ถูกต้อง';
  }
};

// ตัวเลือกสำหรับ Filter และ Sort
const DURATION_FILTERS = [
  { value: "", label: "⏱ ระยะเวลาทั้งหมด" },
  { value: "5-10 นาที", label: "5-10 นาที" },
  { value: "11-30 นาที", label: "11-30 นาที" },
  { value: "31-60 นาที", label: "31-60 นาที" },
  { value: "60 นาทีขึ้นไป", label: "60 นาทีขึ้นไป" },
];

const DIFFICULTY_FILTERS = [
  { value: "", label: "🎯 ความยากทั้งหมด" },
  { value: "ง่าย", label: "ง่าย" },
  { value: "ปานกลาง", label: "ปานกลาง" },
  { value: "ยาก", label: "ยาก" },
];

const SORT_OPTIONS = [
  { value: "", label: "🔃 เรียงตามค่าเริ่มต้น" },
  { value: "rating", label: "⭐ คะแนนสูงสุด" },
  { value: "latest", label: "🕒 สูตรล่าสุด" },
  // { value: "oldest", label: "เก่าที่สุด" }, // ตัวอย่างการเพิ่มตัวเลือก
];


// คอมโพเนนต์สำหรับแสดงหน้าแรก
const HomePage = ({ recipes = [], isLoading, error }) => { // ให้ recipes มีค่า default เป็น array ว่าง
  // State สำหรับการค้นหา
  const [searchTerm, setSearchTerm] = useState('');
  // State สำหรับการกรองตามระยะเวลา
  const [filterTime, setFilterTime] = useState('');
  // State สำหรับการกรองตามระดับความยาก
  const [filterDifficulty, setFilterDifficulty] = useState('');
  // State สำหรับการเลือกดูสูตรอาหารของผู้ใช้คนใดคนหนึ่ง
  const [selectedUser, setSelectedUser] = useState('');
  // State สำหรับการเรียงลำดับสูตรอาหาร
  const [sortBy, setSortBy] = useState('');

  // กรองและเรียงลำดับสูตรอาหารโดยใช้ useMemo เพื่อ optimize performance
  // จะคำนวณใหม่ต่อเมื่อ dependencies (recipes, searchTerm, ...) เปลี่ยนแปลงเท่านั้น
  const filteredAndSortedRecipes = useMemo(() => {
    let processedRecipes = [...recipes]; // สร้างสำเนาเพื่อไม่ให้กระทบ original array

    // 1. กรองตามคำค้นหา (ชื่อเมนู หรือ วัตถุดิบ)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedRecipes = processedRecipes.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(lowerSearchTerm) ||
          (recipe.ingredients && recipe.ingredients.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // 2. กรองตามระยะเวลา
    if (filterTime) {
      processedRecipes = processedRecipes.filter((recipe) => recipe.duration === filterTime);
    }

    // 3. กรองตามระดับความยาก
    if (filterDifficulty) {
      processedRecipes = processedRecipes.filter((recipe) => recipe.difficulty === filterDifficulty);
    }

    // 4. กรองตามผู้ใช้ที่เลือก
    if (selectedUser) {
      processedRecipes = processedRecipes.filter((recipe) => recipe.username === selectedUser);
    }

    // 5. เรียงลำดับสูตรอาหาร
    if (sortBy === 'rating') {
      processedRecipes.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    } else if (sortBy === 'latest') {
      processedRecipes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    // สามารถเพิ่มเงื่อนไขการเรียงลำดับอื่นๆ ได้ เช่น 'oldest'
    // else if (sortBy === 'oldest') {
    //   processedRecipes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    // }

    return processedRecipes;
  }, [recipes, searchTerm, filterTime, filterDifficulty, selectedUser, sortBy]);

  // แสดงสถานะการโหลดหรือข้อผิดพลาด (หากถูกส่งมาจาก App.jsx)
  if (isLoading) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>กำลังโหลดสูตรอาหาร...</p>;
  }
  if (error) {
    return <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>เกิดข้อผิดพลาด: {error}</p>;
  }
  if (!recipes || recipes.length === 0) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>ยังไม่มีสูตรอาหารในระบบ</p>;
  }


  // ส่วน UI ของคอมโพเนนต์
  return (
    <div>
      {/* แถบสำหรับกรองข้อมูล */}
      <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', backgroundColor: '#f7fafc', borderRadius: '8px', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="🔍 ค้นหาชื่อเมนู, วัตถุดิบ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flexGrow: 1, minWidth: '200px' }}
        />
        <select value={filterTime} onChange={(e) => setFilterTime(e.target.value)} style={{ minWidth: '150px' }}>
          {DURATION_FILTERS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} style={{ minWidth: '150px' }}>
          {DIFFICULTY_FILTERS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ minWidth: '150px' }}>
          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {/* แสดงชื่อผู้ใช้ที่กำลังกรองสูตรอาหาร (ถ้ามี) */}
      {selectedUser && (
        <div style={{ padding: '0.5rem 1rem', color: '#4A5568', backgroundColor: '#E2E8F0', borderRadius: '6px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🔍 กำลังดูสูตรของ <strong>{selectedUser}</strong></span>
          <button
            onClick={() => setSelectedUser('')}
            className="btn-clear-filter"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
          >
            ล้าง Filter ผู้ใช้
          </button>
        </div>
      )}

      {/* ตารางแสดงสูตรอาหาร */}
      {filteredAndSortedRecipes.length > 0 ? (
        <div className="recipe-grid">
          {filteredAndSortedRecipes.map((recipe) => (
            // การ์ดแสดงข้อมูลสูตรอาหารแต่ละรายการ
            <div key={recipe.recipe_id} className="recipe-card">
              <img
                src={recipe.image_url || PLACEHOLDER_IMAGE_URL}
                alt={`รูปภาพของ ${recipe.name}`}
                className="recipe-img"
                onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE_URL; }} // Fallback หากรูปโหลดไม่ได้
              />
              <div className="recipe-content">
                <h3 className="recipe-title" title={recipe.name}>{recipe.name}</h3> {/* เพิ่ม title attribute */}

                <p className="recipe-owner" style={{ margin: '0.25rem 0' }}>
                  {/* ชื่อผู้สร้างสูตรอาหาร (คลิกได้เพื่อกรอง) */}
                  <span
                    style={{ color: '#2B6CB0', cursor: 'pointer', fontWeight: '500' }}
                    onClick={() => setSelectedUser(recipe.username)}
                    title={`ดูสูตรทั้งหมดของ ${recipe.username}`}
                  >
                    👨‍🍳 {recipe.username}
                  </span>
                  {/* วันที่สร้างสูตรอาหาร */}
                  <span style={{ color: '#718096', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                    • {formatDate(recipe.created_at)}
                  </span>
                </p>

                <p className="recipe-sub">⏱ {recipe.duration || 'N/A'} | 🎯 {recipe.difficulty || 'N/A'}</p>
                <p className="recipe-rating">
                  ⭐ {recipe.average_rating ? Number(recipe.average_rating).toFixed(1) : 'ยังไม่มีคะแนน'}
                  <span style={{ fontSize: '0.8rem', color: '#A0AEC0', marginLeft: '0.3rem' }}>
                    ({recipe.review_count > 0 ? `${recipe.review_count} รีวิว` : 'ยังไม่มีรีวิว'})
                  </span>
                </p>
                <Link to={`/recipe/${recipe.recipe_id}`} className="btn-detail" style={{width: '85%', marginTop: '0.5rem'}}>
                  ดูรายละเอียด
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', padding: '2rem' }}>ไม่พบสูตรอาหารที่ตรงกับเงื่อนไขการค้นหาของคุณ</p>
      )}
    </div>
  );
};

export default HomePage;
