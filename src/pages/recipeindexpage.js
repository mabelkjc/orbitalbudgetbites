// src/pages/RecipeIndexPage.js
import React, { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/navbar';
import RecipeCard from '../components/recipecard';
import './recipeindexpage.css';

function RecipeIndexPage() {
  const [allRecipes, setAllRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Top Rated');

  useEffect(() => {
    const fetchRecipes = async () => {
      const snapshot = await getDocs(collection(db, 'Recipes'));
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllRecipes(fetched);
    };
    fetchRecipes();
  }, []);

  const filteredRecipes = allRecipes
    .filter(recipe =>
      (recipe.name || '').toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="recipe-index-header">Recipe Index</div>

        <div className="recipe-index-controls">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="recipe-search-input"
          />
          <div className="recipe-sort-dropdown-wrapper">
            <label htmlFor="sort">Sort by:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="recipe-sort-dropdown"
            >
              <option value="Top Rated">Top Rated</option>
              <option value="Shortest Time">Shortest Time</option>
              <option value="A to Z">A to Z</option>
            </select>
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

