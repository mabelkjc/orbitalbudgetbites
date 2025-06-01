import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './home.css';

function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="home-wrapper">
      {/* Top Navigation Bar */}
      <div className="top-bar">
        <div className="top-left">
          <a href="#">COMMUNITY</a>
          <a href="#">RECIPE INDEX</a>
          <a href="#">POPULAR</a>
        </div>
        <div className="top-right">
          <span className="user-icon"></span>
          <div className="dropdown">
            <button className="dropbtn">▼</button>
            <div className="dropdown-content">
              <a href="#">Profile</a>
              <a href="#">Privacy</a>
              <a href="#">Collections</a>
              <a href="#">Settings</a>
              <a href="#" onClick={handleLogout}>Logout</a>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input type="text" placeholder="Search" />
        <button className="search-btn">⌕</button>
      </div>

      {/* Hero Section */}
      <div className="hero">
        <div className="hero-text">
          <h1><strong>Chicken Recipes You'll Love</strong></h1>
          <button className="more-btn">More</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Ingredient Category Filters */}
        <aside className="filters">
          <h2>Ingredient Categories</h2>
          <div className="filter-group">
            <label htmlFor="grain-select">Grains</label>
            <select id="grain-select">
              <option>Rice</option>
              <option>Oats</option>
              <option>Quinoa</option>
              <option>Pasta</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="protein-select">Protein</label>
            <select id="protein-select">
              <option>Chicken</option>
              <option>Eggs</option>
              <option>Tofu</option>
              <option>Beef</option>
              <option>Shrimp</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="veg-select">Vegetables</label>
            <select id="veg-select">
              <option>Broccoli</option>
              <option>Spinach</option>
              <option>Carrot</option>
              <option>Bell Pepper</option>
              <option>Tomato</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="fruit-select">Fruits</label>
            <select id="fruit-select">
              <option>Apple</option>
              <option>Banana</option>
              <option>Orange</option>
              <option>Strawberry</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="dairy-select">Dairy</label>
            <select id="dairy-select">
              <option>Milk</option>
              <option>Cheese</option>
              <option>Yogurt</option>
              <option>Butter</option>
            </select>
          </div>
        </aside>

        {/* Recipe Suggestions Section */}
        <section className="recipes">
          <nav className="main-nav">
            <a href="#">Home</a>
            <a href="#">Explore</a>
            <a href="#">Help</a>
          </nav>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
