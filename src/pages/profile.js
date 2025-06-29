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
                const q = query(recipesRef, where('__name__', 'in', userData.savedRecipes.slice(0, 10))); // limit to 10

                const querySnapshot = await getDocs(q);
                const recipeList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSavedRecipes(recipeList);
            }
        };

        fetchSavedRecipes();
    }, [user, loadingAuth, userData]);

    const handleEditPreferences = () => {
        navigate('/profile/preferences');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;
        console.log('file:', file); //to remove

        const token = await auth.currentUser.getIdToken();
        console.log('Firebase JWT:', token); //to remove

        const supabaseWithAuth = createSupabaseWithAuth(token);

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.uid}.${fileExt}`;
        console.log('fileExt', fileExt); //to remove
        console.log('filePath', filePath); //to remove

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
                <div className="edit-pic">
                <label htmlFor="profile-upload" className="edit-label">Edit</label>
                <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                />
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
                <div className="card-row">
                    {savedRecipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </div>
            </div>

            <div className="section">
                <h3>Community</h3>
                <p>(Liked by me, Created by me – placeholders)</p>
            </div>
        </div>
        </div>
    );
}

export default ProfilePage;
