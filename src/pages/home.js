import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { auth, db } from '../firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import './home.css';
import Navbar from '../components/navbar.js';
import RecipeCard from '../components/recipecard.js';

function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const availableIngredients = {
        "Grains & Starches": ['Rice', 'Quinoa', 'Pasta', 'Oat', 'Bread', 'Ramen', 'Noodle', 'Risotto', 'Tortilla'],
        "Proteins (Non-Seafood)": ['Chicken', 'Egg', 'Tofu', 'Beef', 'Pork', 'Lamb', 'Chicken Nugget', 'Bacon', 'Kidney Bean'],
        "Seafood": ['Shrimp', 'Mussel', 'Salmon', 'Crab', 'Tuna'],
        "Fruits & Vegetables": [
            'Banana', 'Mango', 'Spinach', 'Onion', 'Green Onion', 'Broccoli', 'Carrot',
            'Capsicum', 'Coriander', 'Cauliflower', 'Tomato', 'Lime', 'Garlic',
            'Ginger', 'Mushroom', 'Pea', 'Shallot', 'Avocado', 'Pepper', 'Corn', 'Beansprout', 'Pineapple', 'Parsley', 'Lettuce', 'Thyme', 'Sweet Potato'
        ],
        "Dairy": ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Heavy Cream', 'Soured Cream'],
        "Oils & Fats": ['Olive Oil', 'Oil'],
        "Seasonings & Condiments": [
            'Soy Sauce', 'Garlic Powder', 'Cajun Seasoning',
            'Sesame Seed', 'Sake', 'Mirin', 'Soup Stock', 'Chicken Stock', 'Ketchup', 'Chilli Sauce', 'Vinegar', 'Miso Paste', 'Chilli Oil', 'Mayonnaise', 'Sriracha',
            'Sesame Oil', 'White Wine', 'Tomato Purée', 'Chilli Powder', 'Cumin', 'Paprika', 'Worcestershire Sauce', 'Bouillon'
        ],
        "Nuts & Seeds": ['Almond', 'Cashew'],
        "Pantry & Baking": ['Flour', 'Baking Powder', 'Cornflour', 'Breadcrumb']
    };

    const storedState = sessionStorage.getItem('searchState');
    const initialState = storedState ? JSON.parse(storedState) : location.state || {};

    const [selectedIngredients, setSelectedIngredients] = useState(initialState.selectedIngredients || []);
    const [userAllergies, setUserAllergies] = useState([]);
    const [userRestrictions, setUserRestrictions] = useState([]);
    const [userPreferences, setUserPreferences] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [filteredRecipes, setFilteredRecipes] = useState(initialState.filteredRecipes || []);
    const [hasSearched, setHasSearched] = useState(initialState.hasSearched || false);
    const [hasSearchedManually, setHasSearchedManually] = useState(initialState.hasSearchedManually || false);
    const [message, setMessage] = useState(initialState.message || '');

    useEffect(() => {
        const fetchUserData = async () => {
            const ref = collection(db, 'users');
            const snapshot = await getDocs(ref);
            snapshot.forEach((docSnap) => {
                if (auth.currentUser && docSnap.id === auth.currentUser.uid) {
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
            const restrictionSafe = restrictionsLower.length === 0 || restrictionsLower.every(r => restrictionTags.includes(r));

            return ingredientMatch && allergySafe && restrictionSafe && dietMatch;
        });

        let newMessage = '';
        if (matched.length > 0) {
            if (selectedLower.length > 0) {
                newMessage = (preferencesLower.length || allergiesLower.length || restrictionsLower.length)
                    ? `We found ${matched.length} recipe(s) matching your ingredients and profile.`
                    : `We found ${matched.length} recipe(s) based on your ingredients.`;
            } else {
                newMessage = `We found ${matched.length} recipe(s) based on your profile.`;
            }
        } else {
            newMessage = `No recipes match your filters.`;
        }

        setFilteredRecipes(matched);
        setHasSearched(hasAnyFilters);
        setHasSearchedManually(true);
        setMessage(newMessage);

        sessionStorage.setItem('searchState', JSON.stringify({
            selectedIngredients,
            filteredRecipes: matched,
            hasSearched: hasAnyFilters,
            hasSearchedManually: true,
            message: newMessage
        }));
    };

    const handleClearAll = () => {
        setSelectedIngredients([]);
        setFilteredRecipes(recipes);
        setHasSearched(false);
        setHasSearchedManually(false);
        setMessage('');

        sessionStorage.setItem('searchState', JSON.stringify({
            selectedIngredients: [],
            filteredRecipes: recipes,
            hasSearched: false,
            hasSearchedManually: false,
            message: ''
        }));
    };

    return (
        <div className="home-wrapper">
            <Navbar />
            <div className="main-section">
                <aside className="sidebar">
                    <div className="sidebar-scroll">
                        <h3>Dietary Preference:</h3>
                        <div className="pill-grid">
                            {userPreferences.length
                                ? userPreferences.map(p => <span key={p} className="pill">{p}</span>)
                                : <span className="pill">None</span>}
                        </div>

                        <h3>Allergies:</h3>
                        <div className="pill-grid">
                            {userAllergies.length
                                ? userAllergies.map(a => <span key={a} className="pill">{a}</span>)
                                : <span className="pill">None</span>}
                        </div>

                        <h3>Restrictions:</h3>
                        <div className="pill-grid">
                            {userRestrictions.length
                                ? userRestrictions.map(r => <span key={r} className="pill">{r}</span>)
                                : <span className="pill">None</span>}
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
                        {hasSearched && hasSearchedManually && (
                            <div className="centered-search-message">{message}</div>
                        )}
                        <div className="recipe-list">
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

