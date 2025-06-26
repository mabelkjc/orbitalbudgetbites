import React, { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/navbar';
import RecipeCard from '../components/recipecard';
import './recipeindexpage.css';

function RecipeIndexPage() {
  const [allRecipes, setAllRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [sortBy, setSortBy] = useState('Top Rated');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      const snapshot = await getDocs(collection(db, 'Recipes'));
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllRecipes(fetched);
    };
    fetchRecipes();
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase().trim();
    setSearchTerm(e.target.value);

    const matched = allRecipes.filter(recipe =>
      (recipe.name || '').toLowerCase().includes(value)
    );
    setSuggestions(value ? matched.slice(0, 5) : []);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setDropdownVisible(false);
  };

  const filteredRecipes = allRecipes
    .filter(recipe =>
      (recipe.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
    )
    .sort((a, b) => {
      if (sortBy === 'Top Rated') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'Shortest Time') return (a.cookTime || 0) - (b.cookTime || 0);
      if (sortBy === 'A to Z') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  return (
    <div className="recipe-index-wrapper">
      <Navbar />
      <div className="recipe-index-content">
        <h2 className="recipe-index-header">Recipe Index</h2>

        <div className="recipe-index-controls">
          <div className="search-row">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="recipe-search-input"
            />
            <button className="search-button">🔍</button>
            {searchTerm && (
              <div className="search-suggestions">
                {suggestions.length > 0 ? (
                  suggestions.map(recipe => (
                    <div key={recipe.id} className="suggestion-item">
                      {recipe.name}
                    </div>
                  ))
                ) : (
                  <div className="no-suggestion">No recipes found</div>
                )}
              </div>
            )}
          </div>

          <div className="recipe-sort-wrapper">
            <span className="sort-label">Sort by:</span>
            <button
              className="dropbtn"
              onClick={() => setDropdownVisible(!dropdownVisible)}
            >
              {sortBy} ▼
            </button>
            {dropdownVisible && (
              <div className="dropdown-content">
                <button onClick={() => handleSortChange('Top Rated')}>Top Rated</button>
                <button onClick={() => handleSortChange('Shortest Time')}>Shortest Time</button>
                <button onClick={() => handleSortChange('A to Z')}>A to Z</button>
              </div>
            )}
          </div>
        </div>

        <div className="recipe-grid">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecipeIndexPage;

