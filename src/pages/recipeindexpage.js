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
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('sortBy') || 'Top Rated');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      const snapshot = await getDocs(collection(db, 'Recipes'));

      const fetched = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const recipeId = docSnap.id;

        const reviewsSnapshot = await getDocs(collection(db, 'Recipes', recipeId, 'reviews'));
        const ratings = reviewsSnapshot.docs
          .map(r => r.data().rating)
          .filter(r => typeof r === 'number');

        const avgRating = ratings.length
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null;

        return {
          id: recipeId,
          name: recipeId,
          ...data,
          avgRating,
        };
      }));

      setAllRecipes(fetched);

      const saved = localStorage.getItem('searchTerm');
      if (saved) {
        const trimmed = saved.toLowerCase().trim();
        setSearchTerm(saved);
        const matches = fetched.filter(recipe =>
          (recipe.name || '').toLowerCase().includes(trimmed)
        );
        setFilteredRecipes(matches);
      } else {
        setFilteredRecipes(fetched);
      }

      setLoading(false);
    };

    fetchRecipes();
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const matches = allRecipes.filter(recipe =>
      (recipe.name || '').toLowerCase().includes(value.toLowerCase().trim())
    );
    setSuggestions(value ? matches.slice(0, 5) : []);
  };

  const handleSuggestionClick = (name) => {
    setSearchTerm(name);
    setSuggestions([]);
  };

  const handleSearchSubmit = () => {
    const value = searchTerm.toLowerCase().trim();
    const filtered = allRecipes.filter(recipe =>
      (recipe.name || '').toLowerCase().includes(value)
    );
    setFilteredRecipes(filtered);
    setSuggestions([]);
    localStorage.setItem('searchTerm', searchTerm);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    localStorage.setItem('sortBy', value);
    setDropdownVisible(false);
  };

  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    if (sortBy === 'Top Rated') {
      return (b.avgRating || 0) - (a.avgRating || 0) || (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'Shortest Time') {
      return (a.time || 0) - (b.time || 0) || (b.avgRating || 0) - (a.avgRating || 0);
    }
    if (sortBy === 'A to Z') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
  });

  return (
    <div className="recipe-index-wrapper">
      <Navbar />
      <div className="recipe-index-content">
        <div className="recipe-index-controls">
          <h2 className="recipe-index-header">Recipe Index</h2>

          <div className="header-search-wrapper">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="recipe-search-input"
              />
              {searchTerm && (
                <span
                  className="clear-icon"
                  onClick={() => {
                    setSearchTerm('');
                    setFilteredRecipes(allRecipes);
                    setSuggestions([]);
                    localStorage.removeItem('searchTerm');
                  }}
                >
                  ×
                </span>
              )}
              <span className="search-icon" onClick={handleSearchSubmit}>⌕</span>
              {searchTerm && suggestions.length > 0 && (
                <div className="search-suggestions">
                  {suggestions.map(recipe => (
                    <div
                      key={recipe.id}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(recipe.name)}
                    >
                      {recipe.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
          {loading ? null : sortedRecipes.length === 0 ? (
            <div className="no-recipes-message">No recipes found.</div>
          ) : (
            sortedRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                filteredRecipes={filteredRecipes}
                fromIndexPage={true}
                searchTerm={searchTerm}
                sortBy={sortBy}
                fromPage="/recipeindex"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeIndexPage;


