// components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, setUser, myRecipeCount }) => {
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <nav className="navbar">
      <h1 className="navbar-title">🍲 Wongnok Recipes</h1>
      <div className="navbar-links">
        <Link to="/">ค้นหาสูตร</Link>
        {user && (
        <>
            <Link to="/create">เพิ่มสูตร</Link>
            <Link to="/my-recipes">สูตรของฉัน ({myRecipeCount})</Link>
        </>
        )}
        {!user ? (
          <Link to="/login">เข้าสู่ระบบ</Link>
        ) : (
          <>
            <span className="navbar-user">👋 {user.username}</span>
            <button className="btn-logout" onClick={handleLogout}>ออกจากระบบ</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
