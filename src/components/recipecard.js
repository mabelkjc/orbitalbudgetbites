import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './recipecard.css';

const RecipeCard = ({ recipe, selectedIngredients, filteredRecipes, fromIndexPage }) => {
  const [avgRating, setAvgRating] = useState(null);
  const navigate = useNavigate();
  const imageName = (recipe.id || '').toLowerCase().replace(/\s+/g, '') + '.jpg';
  const imagePath = `/${imageName}`;

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const reviewsRef = collection(doc(db, 'Recipes', recipe.id), 'reviews');
        const reviewsSnap = await getDocs(reviewsRef);
        const ratings = reviewsSnap.docs
          .map(doc => doc.data().rating)
          .filter(r => typeof r === 'number');
        if (ratings.length) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          setAvgRating(avg);
        } else {
          setAvgRating(null);
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
        setAvgRating(null);
      }
    };

    fetchRating();
  }, [recipe.id]);

  const roundedRating = avgRating !== null ? Math.round(avgRating) : 0;

  const handleClick = () => {
    navigate(`/recipe/${recipe.id}`, {
      state: {
        selectedIngredients,
        filteredRecipes,
        from: fromIndexPage ? '/recipeindex' : '/home',
      },
    });
  };

  return (
    <div className="recipe-card-link" onClick={handleClick}>
      <div className="recipe-card">
        <img
          className="recipe-card-image"
          src={imagePath}
          alt={recipe.name || recipe.id}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default.jpg';
          }}
        />
        <div className="recipe-card-content">
          <div className="recipe-card-header">
            <div className="recipe-card-name">{recipe.name || recipe.id}</div>
            <div className="recipe-card-score">
              {avgRating !== null ? avgRating.toFixed(1) : 'No reviews'}
            </div>
          </div>
          <div className="recipe-card-footer">
            <div className="recipe-card-time">⏱️ {recipe.time || 'N/A'} min</div>
            <div className="recipe-card-stars">
              {'★'.repeat(roundedRating)}{'☆'.repeat(5 - roundedRating)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;



