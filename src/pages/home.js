import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './home.css';
import Navbar from '../components/navbar.js';
import RecipeCard from '../components/recipecard';

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const availableIngredients = {
    "Grains & Starches": ['Rice', 'Quinoa', 'Oats', 'Pasta', 'Flour'],
    "Proteins (Non-Seafood)": ['Chicken', 'Eggs', 'Tofu', 'Beef', 'Pork', 'Lamb'],
    Seafood: ['Shrimp', 'Mussels', 'Salmon', 'Crab', 'Tuna'],
    "Fruits & Vegetables": ['Banana', 'Mango', 'Spinach', 'Onion', 'Broccoli', 'Apple'],
    Dairy: ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Cream']
  };

  const storedState = sessionStorage.getItem('searchState');
  const initialState = storedState ? JSON.parse(storedState) : location.state || {};

  const [selectedIngredients, setSelectedIngredients] = useState(initialState.selectedIngredients || []);
  const [userAllergies, setUserAllergies] = useState([]);
  const [userRestrictions, setUserRestrictions] = useState([]);
  const [userPreferences, setUserPreferences] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState(initialState.filteredRecipes || []);
  const [hasSearched, setHasSearched] = useState(!!initialState.filteredRecipes);

  useEffect(() => {
    const fetchUserData = async () => {
      const ref = collection(db, 'users');
      const snapshot = await getDocs(ref);
      snapshot.forEach((docSnap) => {
        if (docSnap.id === auth.currentUser.uid) {
          const data = docSnap.data();
          setUserAllergies(data.allergies || []);
          setUserRestrictions(data.restrictions || []);
          setUserPreferences(data.dietaryPreferences || []);
        }
      });
    };
    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const snapshot = await getDocs(collection(db, 'Recipes'));
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecipes(all);

      if (!initialState.filteredRecipes) {
        setFilteredRecipes(all);
      }
    };
    fetchRecipes();
  }, [initialState.filteredRecipes]);

  const handleMultiSelect = (category, item) => {
    setSelectedIngredients(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSearch = () => {
    const selectedLower = selectedIngredients.map(i => i.toLowerCase());
    const allergiesLower = userAllergies.filter(a => a.toLowerCase() !== 'none').map(a => a.toLowerCase());
    const restrictionsLower = userRestrictions.filter(r => r.toLowerCase() !== 'none').map(r => r.toLowerCase());
    const preferencesLower = userPreferences.filter(p => p.toLowerCase() !== 'none').map(p => p.toLowerCase());

    const hasAnyFilters = selectedLower.length > 0 || allergiesLower.length > 0 || restrictionsLower.length > 0 || preferencesLower.length > 0;

    const matched = recipes.filter(recipe => {
      const tags = (recipe.ingredientTags || []).map(t => t.toLowerCase());
      const allergyTags = (recipe.allergyTags || []).map(t => t.toLowerCase());
      const restrictionTags = (recipe.restrictionTags || []).map(t => t.toLowerCase());
      const dietTags = (recipe.dietTags || []).map(t => t.toLowerCase());

      const ingredientMatch = selectedLower.length === 0 || tags.some(tag => selectedLower.includes(tag));
      const dietMatch = preferencesLower.length === 0 || preferencesLower.every(p => dietTags.includes(p));
      const allergySafe = !allergyTags.some(tag => allergiesLower.includes(tag));
      const restrictionSafe = !restrictionTags.some(tag => restrictionsLower.includes(tag));

      return ingredientMatch && allergySafe && restrictionSafe && dietMatch;
    });

    setFilteredRecipes(matched);
    setHasSearched(hasAnyFilters);

    sessionStorage.setItem(
      'searchState',
      JSON.stringify({ selectedIngredients, filteredRecipes: matched })
    );
  };

  const handleClearAll = () => {
    setSelectedIngredients([]);
    setFilteredRecipes(recipes);
    setHasSearched(false);
    sessionStorage.removeItem('searchState');
  };

  return (
    <div className="home-wrapper">
      <Navbar />

      <div className="main-section">
        <aside className="sidebar">
          <div className="sidebar-scroll">
            <h3>Dietary Preference:</h3>
            <div className="pill-grid">
              {userPreferences.length ? userPreferences.map(p => <span key={p} className="pill">{p}</span>) : <span className="pill">None</span>}
            </div>

            <h3>Allergies:</h3>
            <div className="pill-grid">
              {userAllergies.length ? userAllergies.map(a => <span key={a} className="pill">{a}</span>) : <span className="pill">None</span>}
            </div>

            <h3>Restrictions:</h3>
            <div className="pill-grid">
              {userRestrictions.length ? userRestrictions.map(r => <span key={r} className="pill">{r}</span>) : <span className="pill">None</span>}
            </div>

            <h3>Select your ingredients:</h3>
            {Object.entries(availableIngredients).map(([category, items]) => (
              <div key={category} className="filter-category">
                <div className="filter-header">{category}</div>
                <div className="checkbox-list">
                  {items.map(item => (
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
            <button onClick={handleClearAll} className="clear-btn">Clear All</button>
            <button onClick={handleSearch} className="search-btn">Update & Search</button>
          </div>
        </aside>

        <div className="recipe-scroll-area">
          <div className="recipe-section">
            <div className="recipe-list">
              {hasSearched && (
                <div className="centered-search-message">
                  {filteredRecipes.length > 0
                    ? `We found ${filteredRecipes.length} recipe(s) for you.`
                    : 'No recipes match your filters.'}
                </div>
              )}
              {filteredRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  selectedIngredients={selectedIngredients}
                  filteredRecipes={filteredRecipes}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;