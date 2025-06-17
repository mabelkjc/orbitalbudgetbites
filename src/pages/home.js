import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './home.css';

function HomePage() {
  const navigate = useNavigate();
  
  const availableIngredients = {
    "Grains & Starches": ['Rice', 'Quinoa', 'Oats', 'Pasta', 'Flour'],
    "Proteins (Non-Seafood)": ['Chicken', 'Eggs', 'Tofu', 'Beef', 'Pork', 'Lamb'],
    Seafood: ['Shrimp', 'Mussels', 'Salmon', 'Crab', 'Tuna'],
    "Fruits & Vegetables": ['Banana', 'Mango', 'Spinach', 'Onion', 'Broccoli', 'Apple'],
    Dairy: ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Cream']
  };

  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [userAllergies, setUserAllergies] = useState([]);
  const [userRestrictions, setUserRestrictions] = useState([]);
  const [userPreferences, setUserPreferences] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      const ref = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserAllergies(data.allergies || []);
        setUserRestrictions(data.restrictions || []);
        setUserPreferences(data.dietaryPreferences || []);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleSearch = () => {
    navigate('/recipes');
  };

  const handleDropdownToggle = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleMultiSelect = (category, item) => {
    setSelectedIngredients((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  return (
    <div className="home-wrapper">
      <div className="top-bar">
        <nav className="nav-links">
          <Link to="/community">Community</Link>
          <Link to="/index">Recipe Index</Link>
        </nav>
        <div className="logo">
          <img src="/budgetbitesfinal.png" alt="Budget Bites Logo" />
        </div>
        <div className="profile-menu">
          <span className="user-icon"></span>
          <button className="dropbtn" onClick={handleDropdownToggle}>▼</button>
          {dropdownVisible && (
            <div className="dropdown-content">
              <Link to="/profile">Profile</Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>

      <div className="main-section">
        <aside className="sidebar">
          <h3>Dietary Preference:</h3>
          <div className="pill-grid">
            {userPreferences.length > 0 ? userPreferences.map((p) => (
              <span key={p} className="pill">{p}</span>
            )) : <span className="pill">None</span>}
          </div>

          <h3>Allergies:</h3>
          <div className="pill-grid">
            {userAllergies.length > 0 ? userAllergies.map((a) => (
              <span key={a} className="pill">{a}</span>
            )) : <span className="pill">None</span>}
          </div>

          <h3>Restrictions:</h3>
          <div className="pill-grid">
            {userRestrictions.length > 0 ? userRestrictions.map((r) => (
              <span key={r} className="pill">{r}</span>
            )) : <span className="pill">None</span>}
          </div>

          <h3>Select your ingredients:</h3>
          {Object.entries(availableIngredients).map(([category, items]) => (
            <div key={category} className="filter-category">
              <div className="filter-header">{category}</div>
              <div className="checkbox-list">
                {items.map((item) => (
                  <label key={item} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedIngredients.includes(item)}
                      onChange={() => handleMultiSelect(category, item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSearch} className="search-btn">Update & Search</button>
        </aside>
      </div>
    </div>
  );
}

export default HomePage;

