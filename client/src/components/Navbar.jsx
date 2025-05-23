// components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout, myRecipeCount }) => {

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
            <button className="btn-logout" onClick={onLogout}>ออกจากระบบ</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
