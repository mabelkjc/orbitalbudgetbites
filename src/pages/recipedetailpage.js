import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, collection, getDocs, addDoc, serverTimestamp,
  query, orderBy, setDoc
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import Navbar from '../components/navbar';
import './recipedetailpage.css';

function RecipeDetail() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [user] = useAuthState(auth);
    const [isSaved, setIsSaved] = useState(false);

    const selectedIngredients = location.state?.selectedIngredients || [];
    const filteredRecipes = location.state?.filteredRecipes || [];
    const backPath = location.state?.from || '/home';

    useEffect(() => {
        const checkIfSaved = async () => {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            const data = userSnap.data();
            setIsSaved(data?.savedRecipes?.includes(id));
        };
        if (user) checkIfSaved();
    }, [user, id]);

    const toggleSaveRecipe = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data();
        const updated = isSaved
            ? data.savedRecipes.filter(rid => rid !== id)
            : [...(data.savedRecipes || []), id];

        await setDoc(userRef, { savedRecipes: updated }, { merge: true });
        setIsSaved(!isSaved);
    };

    useEffect(() => {
        const fetchRecipe = async () => {
            const docRef = doc(db, 'Recipes', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setRecipe({ id: docSnap.id, ...docSnap.data() });
            }
        };

        const fetchReviews = async () => {
            const reviewsRef = collection(db, 'Recipes', id, 'reviews');
            const reviewsQuery = query(reviewsRef, orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(reviewsQuery);
            const reviewPromises = querySnapshot.docs.map(async (reviewDoc) => {
                const data = reviewDoc.data();
                let username = 'Anonymous';
                if (data.userId) {
                    try {
                        const userRef = doc(db, 'users', data.userId);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            username = userSnap.data().username || username;
                        }
                    } catch (error) {
                        console.error("Error fetching user data:", error);
                    }
                }
                return {
                    ...data,
                    username,
                    timestamp: data.timestamp?.toDate?.() || null
                };
            });
            const resolvedReviews = await Promise.all(reviewPromises);
            setReviews(resolvedReviews);
        };

        fetchRecipe();
        fetchReviews();
    }, [id]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in to leave a review.");
            return;
        }
        const review = {
            comment: newComment,
            rating: newRating,
            timestamp: serverTimestamp(),
            userId: user.uid,
        };
        await addDoc(collection(db, "Recipes", id, "reviews"), review);
        try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();

            if (!userData.ratedRecipes?.includes(id)) {
                await setDoc(userRef, {
                    ratedRecipes: [...(userData.ratedRecipes || []), id]
                }, { merge: true });
            }
        } catch (error) {
            console.error("Error updating ratedRecipes:", error);
        }
        alert("Review submitted!");
        setNewComment('');
        setNewRating(5);
        const updatedReviews = await getDocs(query(collection(db, 'Recipes', id, 'reviews'), orderBy("timestamp", "desc")));
        const reviewPromises = updatedReviews.docs.map(async (reviewDoc) => {
            const data = reviewDoc.data();
            let username = 'Anonymous';
            if (data.userId) {
                try {
                    const userRef = doc(db, 'users', data.userId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        username = userSnap.data().username || username;
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
            return {
                ...data,
                username,
                timestamp: data.timestamp?.toDate?.() || null
            };
        });
        setReviews(await Promise.all(reviewPromises));
    };

    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    const renderStars = (rating) => {
        const rounded = Math.round(rating);
        const fullStars = Math.min(rounded, 5);
        const emptyStars = 5 - fullStars;
        return (
            <span className="gold-stars">
                {'★'.repeat(fullStars)}
                {'☆'.repeat(emptyStars)}
            </span>
        );
    };

    const cleanSelected = (selectedIngredients || [])
        .filter(i => typeof i === 'string')
        .map(i => i.trim().toLowerCase());

    const missingIngredients = (recipe?.ingredientTags || []).filter(tag =>
        !cleanSelected.includes(tag.trim().toLowerCase())
    );

    if (!recipe) return <div>Loading...</div>;

    return (
        <div className="detail-wrapper">
        <Navbar />
            <div style={{ paddingLeft: '4vw', marginTop: '1rem' }}>
                <button
                    onClick={() =>
                        navigate(backPath, {
                            state: { selectedIngredients, filteredRecipes }
                        })
                    }
                    style={{
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}>
                    ← Back
                </button>
            </div>

            <div className="detail-container">
                <div className="left-panel">
                    <img
                        src={recipe.imageURL || `/${(recipe.id || '').toLowerCase().replace(/\s+/g, '')}.jpg`}
                        alt={recipe.id}
                        className="main-image"
                    />
                </div>

                <div className="right-panel">
                    <div className="title-save-wrapper">
                        <h1 className="recipe-name">{recipe.id}</h1>
                        <button className="save-button" onClick={toggleSaveRecipe}>
                            {isSaved ? 'Unsave Recipe' : 'Save Recipe'}
                        </button>
                    </div>
                    <div className="time-rating">
                        <span className="time">⏱ {recipe.time ? `${recipe.time} mins` : '25 mins'}</span>
                        <span className="stars">{renderStars(averageRating)}</span>
                        <span className="reviews">{averageRating.toFixed(1)} ({reviews.length} reviews)</span>
                    </div>

                    <div className="tags">
                        {[...(recipe.dietTags || []), ...(recipe.allergyTags || []), ...(recipe.restrictionTags || [])]
                            .map((tag, i) => <span key={i} className="pill">{tag}</span>)}
                    </div>

                    {Array.isArray(selectedIngredients) && backPath === '/home' && (
                        <div className="missing">
                            {selectedIngredients.length === 0 ? (
                                <p>Select ingredients to see what you're missing!</p>
                            ) : missingIngredients.length > 0 ? (
                                <>
                                <h4>You are missing...</h4>
                                <div className="missing-content">
                                    <ul>
                                        {missingIngredients.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <button
                                className="store-btn"
                                onClick={() =>
                                    navigate('/find-stores', {
                                    state: {
                                        from: `/recipe/${id}`,
                                        selectedIngredients,
                                        filteredRecipes
                                    }
                                    })
                                }
                                >
                                Find Stores Near Me
                                </button>
                                </>
                            ) : (
                                <p>You're not missing anything!</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="section-wrapper">
                <h3>Ingredients (servings: {recipe.servings || 2})</h3>
                <ol className="ingredient-list bold-numbers">
                    {recipe.ingredients.map((ing, idx) => (
                        <li key={idx}>{ing}</li>
                    ))}
                </ol>
            </div>

            <div className="section-wrapper">
                <h3>Instructions</h3>
                <ol className="ingredient-list bold-numbers">
                    {recipe.method.map((step, idx) => (
                        <li key={idx}>{step}</li>
                    ))}
                </ol>
            </div>

            <div className="review-section section-wrapper">
                <h3>Leave a Review</h3>
                <form onSubmit={handleSubmitReview} className="review-form">
                    <label>Rating (1–5):</label>
                    <input
                        type="number"
                        min="1"
                        max="5"
                        value={newRating}
                        onChange={(e) => setNewRating(parseInt(e.target.value))}
                        required
                    />
                    <label>Comment:</label>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows="4"
                        cols="40"
                        className="fixed-comment-box"
                        required
                    />
                    <button type="submit">Submit Review</button>
                </form>

                <div className="review-list">
                    <h3>Reviews</h3>
                    <div className="scrollable-reviews">
                        {reviews.map((r, i) => (
                            <div key={i} className="review-item">
                                <div className="review-header">
                                <strong>{r.username}</strong>
                                {r.timestamp && (
                                    <div className="review-time">
                                        {new Date(r.timestamp).toLocaleDateString()} {new Date(r.timestamp).toLocaleTimeString()}
                                    </div>
                                )}
                                <div className="review-stars">{renderStars(r.rating)}</div>
                                </div>
                                <p>{r.comment}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RecipeDetail;
