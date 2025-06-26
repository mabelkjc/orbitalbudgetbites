// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('searchState'); // ✅ Clear homepage filters on logout
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="top-bar">
      <nav className="nav-links">
        <Link to="/community">Community</Link>
        <Link to="/recipeindex">Recipe Index</Link> {/* ✅ Fixed this line */}
      </nav>
      <div className="logo">
        <img src="/budgetbitesfinal.png" alt="Budget Bites Logo" />
      </div>
      <div className="profile-menu">
        <span className="user-icon" />
        <button className="dropbtn" onClick={() => setDropdownVisible(!dropdownVisible)}>▼</button>
        {dropdownVisible && (
          <div className="dropdown-content">
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;
