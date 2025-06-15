import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './home.css';

function HomePage() {
  const navigate = useNavigate();
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [userAllergies, setUserAllergies] = useState([]);
  const [userRestrictions, setUserRestrictions] = useState([]);
  const [userPreferences, setUserPreferences] = useState([]);

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

      setAvailableIngredients([
        'Basil', 'Chicken', 'Vegetable oil', 'Cucumbers', 'Broccoli',
        'Parsley', 'Carrots', 'Milk', 'Oranges', 'Bananas',
        'Sugar', 'Honey', 'Flour', 'Vanilla', 'Olive oil',
        'Shrimps', 'Potatoes', 'Rice', 'Tomatoes', 'Salt',
        'Lemons', 'Garlic', 'Onions', 'Butter', 'Water', 'Eggs', 'Red chillies'
      ]);
    };
    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const handleSearch = () => {
    navigate('/recipes');
  };

  return (
    <div className="home-wrapper">
      <div className="top-bar">
        <div className="top-left">
          <Link to="/community">COMMUNITY</Link>
          <Link to="/index">RECIPE INDEX</Link>
          <Link to="/popular">POPULAR</Link>
        </div>
        <div className="top-right">
          <span className="user-icon"></span>
          <div className="dropdown">
            <button className="dropbtn">▼</button>
            <div className="dropdown-content">
              <Link to="/profile">Profile</Link>
              <Link to="#" onClick={handleLogout}>Logout</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <aside className="filters">
          <h2>
            Your Preferences
            <div className="subheading">Based on your profile</div>
          </h2>
          <div className="filter-group">
            <label>Dietary Preferences:</label>
            <div className="pill-grid">
              {userPreferences.length > 0 ? userPreferences.map((p) => (
                <span key={p} className="pill green">{p}</span>
              )) : <span className="pill green">None</span>}
            </div>
          </div>

          <div className="filter-group">
            <label>Allergies:</label>
            <div className="pill-grid">
              {userAllergies.length > 0 ? userAllergies.map((a) => (
                <span key={a} className={`pill ${a === 'None' ? 'green' : 'red'}`}>{a}</span>
              )) : <span className="pill green">None</span>}
            </div>
          </div>

          <div className="filter-group">
            <label>Restrictions:</label>
            <div className="pill-grid">
              {userRestrictions.length > 0 ? userRestrictions.map((r) => (
                <span key={r} className="pill green">{r}</span>
              )) : <span className="pill green">None</span>}
            </div>
          </div>

          <div className="edit-link" style={{ textAlign: 'center' }}>
            <Link to="/profile">
              <button className="profile-btn">Edit in Profile</button>
            </Link>
          </div>
        </aside>

        <div className="ingredient-section">
          <h2>What's in Your Kitchen?</h2>
          <div className="ingredient-input">
            <input placeholder="Type to search..." />
          </div>
          <div className="ingredient-list">
            {availableIngredients.map((ingredient) => (
              <button
                key={ingredient}
                className={`pill ${selectedIngredients.includes(ingredient) ? 'selected' : ''}`}
                onClick={() => toggleIngredient(ingredient)}
              >
                {ingredient}
              </button>
            ))}
          </div>
          <div className="selected-section">
            <h3>Selected Ingredients</h3>
            <div className="pill-grid">
              {selectedIngredients.map((ingredient) => (
                <span key={ingredient} className="pill selected">{ingredient}</span>
              ))}
            </div>
            <button onClick={handleSearch} className="search-btn">Search Recipes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

