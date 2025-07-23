import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import Navbar from '../components/navbar';
import RecipeCard from '../components/recipecard';
import PostCard from '../components/postcard';
import './profile.css';

function ProfilePage() {
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    const [user, loadingAuth] = useAuthState(auth);
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [ratedRecipes, setRatedRecipes] = useState([]);
    const [showAvatars, setShowAvatars] = useState(false);
    const [likedPosts, setLikedPosts] = useState([]);
    const [createdPosts, setCreatedPosts] = useState([]);
    const { userId } = useParams();
    const isMyProfile = !userId || user?.uid === userId;

    useEffect(() => {
        const fetchData = async () => {
            if (!loadingAuth && (user || userId)) {
                const ref = doc(db, 'users', userId || user.uid);
                const docSnap = await getDoc(ref);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            }
        };
        fetchData();
    }, [user, loadingAuth, userId]);

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

    useEffect(() => {
        const fetchCommunityPosts = async () => {
            if (!loadingAuth && user) {
                const postsRef = collection(db, 'communityPosts');
                const snapshot = await getDocs(postsRef);
                const targetUid = userId || user?.uid;
                const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                setLikedPosts(allPosts.filter(p => Array.isArray(p.likes) && p.likes.includes(targetUid)));
                setCreatedPosts(allPosts.filter(p => p.userId === targetUid));
            }
        };

        fetchCommunityPosts();
    }, [user, loadingAuth, userId]);

    const handleEditPreferences = () => {
        navigate('/profile/preferences', { state: { from: 'profile' } });
    };

    if (loadingAuth || !userData) return <div>Loading...</div>;

    return (
        <div className="profile-wrapper">
            <Navbar />
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-picture-wrapper">
                        <img
                            src={
                                userData.profilePicture && userData.profilePicture.startsWith('/avatars/')
                                    ? userData.profilePicture
                                    : '/avatars/default-profile.png'}
                            alt="Profile"
                            className="profile-picture"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/avatars/default-profile.png';
                            }}
                        />
                        <div className="edit-pic-wrapper">
                            {isMyProfile && (
                                <>
                                    <label className="edit-label" onClick={() => setShowAvatars(!showAvatars)}>
                                        Edit Avatar
                                    </label>
                                    {showAvatars && (
                                        <div className="avatar-selection">
                                            {['tacos.png', 'boba.png', 'onigiri.png', 'buns.png',
                                            'donut.png', 'egg.png', 'hamburger.png', 'healthy-food.png',
                                            'pizza.png', 'spaghetti.png', 'ape.png', 'bear.png',
                                            'joyful.png', 'silly.png', 'profile.png'
                                            ].map(filename => {
                                                const avatarPath = `/avatars/${filename}`;
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
                                </>
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

                        {isMyProfile && (
                            <button className="editpref-button" onClick={handleEditPreferences}>Edit Preferences</button>
                        )}
                    </div>
                </div>

                <div className="section">
                    <h3>Recipes</h3>

                    <h4>Saved by Me</h4>
                    <div className="card-wrapper">
                        {savedRecipes.length > 0 ? (
                            <div className="card-row recipes">
                                {savedRecipes.map(recipe => (
                                    <RecipeCard key={recipe.id} recipe={recipe} fromPage="/profile" />
                                ))}
                            </div>
                        ) : (
                            <p>You haven't saved any recipes yet.</p>
                        )}
                    </div>

                    <h4>Rated by Me</h4>
                    <div className="card-wrapper">
                        {ratedRecipes.length > 0 ? (
                            <div className="card-row recipes">
                                {ratedRecipes.map(recipe => (
                                    <RecipeCard key={recipe.id} recipe={recipe} fromPage="/profile" />
                                ))}
                            </div>
                        ) : (
                            <p>You haven't rated any recipes yet.</p>
                        )}
                    </div>
                </div>

                <div className="section">
                    <h3>Community</h3>

                    <h4>Liked by Me</h4>
                    <div className="card-wrapper">
                        {likedPosts.length > 0 ? (
                            <div className="card-row posts">
                                {likedPosts.map(post => (
                                    <PostCard key={post.id} post={post} visiblePosts={0} />
                                ))}
                            </div>
                        ) : (
                            <p>You haven't liked any posts yet.</p>
                        )}
                    </div>

                    <h4>Created by Me</h4>
                    <div className="card-wrapper">
                        {createdPosts.length > 0 ? (
                            <div className="card-row posts">
                                {createdPosts.map(post => (
                                    <PostCard key={post.id} post={post} visiblePosts={0} />
                                ))}
                            </div>
                        ) : (
                            <p>You haven't created any posts yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;