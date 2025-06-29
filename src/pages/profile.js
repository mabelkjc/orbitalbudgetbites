import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { createSupabaseWithAuth } from '../supabase';
import Navbar from '../components/navbar';
import RecipeCard from '../components/recipecard';
import './profile.css';

function ProfilePage() {
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    const [user, loadingAuth] = useAuthState(auth);
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [ratedRecipes, setRatedRecipes] = useState([]);
    const [showAvatars, setShowAvatars] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!loadingAuth && user) {
                const ref = doc(db, 'users', user.uid);
                const docSnap = await getDoc(ref);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            }
        };
        fetchData();
    }, [user, loadingAuth]);

    useEffect(() => {
        const fetchSavedRecipes = async () => {
            if (!loadingAuth && user && userData?.savedRecipes?.length > 0) {
                const recipesRef = collection(db, 'Recipes');
                const q = query(recipesRef, where('__name__', 'in', userData.savedRecipes.slice(0, 10)));

                const querySnapshot = await getDocs(q);
                const recipeList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSavedRecipes(recipeList);
            }
        };

        fetchSavedRecipes();
    }, [user, loadingAuth, userData]);

    useEffect(() => {
        const fetchRatedRecipes = async () => {
            if (!loadingAuth && user && userData?.ratedRecipes?.length > 0) {
                const recipesRef = collection(db, 'Recipes');
                const q = query(recipesRef, where('__name__', 'in', userData.ratedRecipes.slice(0, 10)));

                const querySnapshot = await getDocs(q);
                const recipeList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRatedRecipes(recipeList);
            }
        };

        fetchRatedRecipes();
    }, [user, loadingAuth, userData]);

    const handleEditPreferences = () => {
        navigate('/profile/preferences', { state: { from: 'profile' } });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        const token = await auth.currentUser.getIdToken();
        const supabaseWithAuth = createSupabaseWithAuth(token);

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.uid}.${fileExt}`;

        const { error: uploadError } = await supabaseWithAuth
            .storage
            .from('profile-pictures')
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            console.error(uploadError);
            alert('Upload failed.');
            return;
        }

        const { data: publicUrlData } = supabaseWithAuth
            .storage
            .from('profile-pictures')
            .getPublicUrl(filePath);

        const downloadURL = publicUrlData.publicUrl;

        await setDoc(doc(db, 'users', user.uid), {
            profilePicture: downloadURL
        }, { merge: true });

        setUserData((prev) => ({ ...prev, profilePicture: downloadURL }));
    };

    if (loadingAuth || !userData) return <div>Loading...</div>;

    return (
        <div className="profile-wrapper">
            <Navbar />
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-picture-wrapper">
                        <img
                            src={userData.profilePicture || '/default-profile.png'}
                            alt="Profile"
                            className="profile-picture"
                        />
                        <div className="edit-pic-wrapper">
                            <label className="edit-label" onClick={() => setShowAvatars(!showAvatars)}>Edit Avatar</label>
                            {showAvatars && (
                                <div className="avatar-selection">
                                    {['tacos.png', 'boba.png', 'onigiri.png', 'silly.png'].map(filename => {
                                        const avatarPath = `/${filename}`;
                                        return (
                                            <img
                                                key={filename}
                                                src={avatarPath}
                                                alt={filename}
                                                className={`avatar-option ${userData.profilePicture === avatarPath ? 'selected' : ''}`}
                                                onClick={async () => {
                                                    await setDoc(doc(db, 'users', user.uid), {
                                                        profilePicture: avatarPath
                                                    }, { merge: true });
                                                    setUserData(prev => ({ ...prev, profilePicture: avatarPath }));
                                                    setShowAvatars(false);
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-info">
                        <h2>{userData.username || 'User'}</h2>
                        <div className="tags-section">
                            <p><strong>My Dietary Preferences & Restrictions:</strong></p>
                            <div className="tag-row">
                                {[...(userData.dietaryPreferences || []), ...(userData.restrictions || [])].map((tag, i) => (
                                    <span key={i} className="tag">{tag}</span>
                                ))}
                            </div>

                            <p><strong>My Allergies:</strong></p>
                            <div className="tag-row">
                                {(userData.allergies || []).map((tag, i) => (
                                    <span key={i} className="tag">{tag}</span>
                                ))}
                            </div>
                        </div>

                        <button className="editpref-button" onClick={handleEditPreferences}>Edit Preferences</button>
                    </div>
                </div>

                <div className="section">
                    <h3>Recipes</h3>
                    <h4>Saved by Me</h4>
                    <div className="card-wrapper">
                        <div className="card-row">
                            {savedRecipes.map(recipe => (
                                <RecipeCard key={recipe.id} recipe={recipe} fromPage="/profile" />
                            ))}
                        </div>
                    </div>
                    <h4>Rated by Me</h4>
                    <div className="card-wrapper">
                        <div className="card-row">
                            {ratedRecipes.map(recipe => (
                                <RecipeCard key={recipe.id} recipe={recipe} fromPage="/profile" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="section">
                    <h3>Community</h3>
                    <p>(Liked by me, Created by me - placeholders)</p>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;