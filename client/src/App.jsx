// App.jsx
// Import โมดูลที่จำเป็นจาก React และ react-router-dom
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import page components
import HomePage from './pages/HomePage';
import RecipeForm from './pages/RecipeForm';
import Register from './pages/Register';
import Login from './pages/Login';
import RecipeDetail from './pages/RecipeDetail';
import EditRecipe from './pages/EditRecipe';
import MyRecipes from './pages/MyRecipes';

// Import reusable components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute'; // Component to protect routes that require authentication

// Import global styles
import './App.css';

// ค่าคงที่สำหรับ API
const API_BASE_URL = 'http://localhost:5000/api';

// คอมโพเนนต์หลักของแอปพลิเคชัน
export default function App() {
  // State สำหรับเก็บข้อมูลผู้ใช้ปัจจุบัน
  // เริ่มต้นค่า user state จาก localStorage หากมี session ผู้ใช้ที่ถูกเก็บไว้ก่อนหน้านี้
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      localStorage.removeItem('user'); // ล้างข้อมูลที่เสียหายออกจาก localStorage
      return null;
    }
  });

  // State สำหรับเก็บรายการสูตรอาหารทั้งหมด
  const [recipes, setRecipes] = useState([]);
  // State สำหรับจัดการสถานะการโหลดข้อมูล
  const [isLoading, setIsLoading] = useState(true);
  // State สำหรับจัดการข้อผิดพลาดในการโหลดข้อมูล
  const [error, setError] = useState(null);

  // Function to fetch all recipes from the backend API
  // ใช้ useCallback เพื่อ memoize ฟังก์ชันนี้ ป้องกันการสร้างใหม่ทุกครั้งที่ App re-render โดยไม่จำเป็น
  const fetchRecipes = useCallback(async () => {
    setIsLoading(true); // เริ่มการโหลด
    setError(null); // ล้างข้อผิดพลาดเก่า
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`);
      if (!response.ok) {
        // หาก server ตอบกลับมาด้วย status ที่ไม่ใช่ 2xx
        const errorData = await response.json();
        throw new Error(errorData.error || `เกิดข้อผิดพลาด: ${response.status}`);
      }
      const data = await response.json();
      setRecipes(data); // อัปเดต recipes state ด้วยข้อมูลที่ดึงมาได้
    } catch (err) {
      console.error('โหลดสูตรอาหารล้มเหลว:', err); // แสดงข้อผิดพลาดใน console
      setError(err.message); // เก็บข้อความข้อผิดพลาดเพื่อแสดงผลใน UI (ถ้าต้องการ)
    } finally {
      setIsLoading(false); // สิ้นสุดการโหลด ไม่ว่าสำเร็จหรือล้มเหลว
    }
  }, []); // Dependency array ว่างเปล่า เพราะ API_BASE_URL เป็นค่าคงที่

  // useEffect hook to fetch recipes when the component mounts for the first time
  useEffect(() => {
    fetchRecipes(); // Call the fetchRecipes function
  }, [fetchRecipes]); // เพิ่ม fetchRecipes ใน dependency array

  // Derived state: Filters the recipes to get only those created by the currently logged-in user.
  // If no user is logged in, myRecipes will be an empty array.
  const myRecipes = user ? recipes.filter(r => r.user_id === user.user_id) : [];

  // ฟังก์ชันสำหรับ Logout
  const handleLogout = () => {
    localStorage.removeItem('user'); // ลบข้อมูลผู้ใช้ออกจาก localStorage
    setUser(null); // ตั้งค่า user state เป็น null
    // อาจจะมีการ redirect ไปหน้า login หรือ home page ตามต้องการ
  };


  // The component returns the main structure of the application, including routing.
  return (
    <Router>
      {/* Navbar component, displayed on all pages.
          It receives user state, a function to update user state, and the count of user's recipes. */}
      <Navbar user={user} onLogout={handleLogout} myRecipeCount={myRecipes.length} />
      {/* Main container for the page content */}
      <div className="app-container">
        {/* แสดงสถานะการโหลดหรือข้อผิดพลาด */}
        {isLoading && <p style={{ textAlign: 'center', padding: '1rem' }}>กำลังโหลดสูตรอาหาร...</p>}
        {error && !isLoading && <p style={{ textAlign: 'center', padding: '1rem', color: 'red' }}>เกิดข้อผิดพลาดในการโหลดข้อมูล: {error}</p>}

        {/* Routes component defines the different navigation paths and their corresponding components */}
        {/* แสดง Routes ต่อเมื่อโหลดข้อมูลเสร็จและไม่มีข้อผิดพลาด หรือเมื่อมีข้อมูล recipes อยู่แล้ว */}
        {!isLoading && !error && (
          <Routes>
            {/* Route for the home page, displays all recipes */}
            <Route path="/" element={<HomePage recipes={recipes} isLoading={isLoading} error={error} />} />
            {/* Route for user registration */}
            <Route path="/register" element={<Register apiBaseUrl={API_BASE_URL} />} />
            {/* Route for user login, passes setUser to update user state upon successful login */}
            <Route path="/login" element={<Login setUser={setUser} apiBaseUrl={API_BASE_URL} />} />
            {/* Route to display details of a specific recipe, identified by its ID.
                Passes the current user to the RecipeDetail component. */}
            <Route path="/recipe/:id" element={<RecipeDetail user={user} apiBaseUrl={API_BASE_URL} />} />
            {/* Route for creating a new recipe.
                This route is protected by PrivateRoute, meaning only logged-in users can access it. */}
            <Route
              path="/create"
              element={
                <PrivateRoute user={user}>
                  {/* RecipeForm for creating a new recipe.
                      Passes the current user and the fetchRecipes function (to refresh the list after creation). */}
                  <RecipeForm user={user} fetchRecipes={fetchRecipes} apiBaseUrl={API_BASE_URL} />
                </PrivateRoute>
              }
            />
            {/* Route for editing an existing recipe, identified by its ID.
                This route is also protected by PrivateRoute. */}
            <Route
              path="/edit/:id"
              element={
                <PrivateRoute user={user}>
                  {/* EditRecipe component for modifying a recipe. Passes the current user. */}
                  <EditRecipe user={user} fetchRecipes={fetchRecipes} apiBaseUrl={API_BASE_URL} />
                </PrivateRoute>
              }
            />
            {/* Route for displaying recipes created by the logged-in user.
                Protected by PrivateRoute. */}
            <Route
              path="/my-recipes"
              element={
                <PrivateRoute user={user}>
                  {/* MyRecipes component displays the user's own recipes.
                      Passes the filtered list of user's recipes, the user object, and fetchRecipes. */}
                  <MyRecipes
                    recipes={myRecipes}
                    user={user}
                    fetchRecipes={fetchRecipes}
                    apiBaseUrl={API_BASE_URL}
                  />
                </PrivateRoute>
              }
            />
          </Routes>
        )}
      </div>
    </Router>
  );
}
