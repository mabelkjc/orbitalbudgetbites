import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

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
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showFollowerModal, setShowFollowerModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [followerUsers, setFollowerUsers] = useState([]);
    const [followingUsers, setFollowingUsers] = useState([]);
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
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserData(data);

                    setFollowers(data.followers || []);
                    setFollowing(data.following || []);
                    
                    if (!isMyProfile && user) {
                        setIsFollowing(data.followers?.includes(user.uid));
                    }
                }
            }
            
        };
        fetchData();
    }, [user, loadingAuth, userId, isMyProfile]);

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

    const handleFollowToggle = async () => {
        if (!user || !userId) return;

        const myRef = doc(db, 'users', user.uid);
        const theirRef = doc(db, 'users', userId);

        const mySnap = await getDoc(myRef);
        const theirSnap = await getDoc(theirRef);

        if (!mySnap.exists() || !theirSnap.exists()) return;

        const myData = mySnap.data();
        const theirData = theirSnap.data();

        const isCurrentlyFollowing = theirData.followers?.includes(user.uid);

        const updatedMyFollowing = isCurrentlyFollowing
            ? (myData.following || []).filter(uid => uid !== userId)
            : [...(myData.following || []), userId];

        const updatedTheirFollowers = isCurrentlyFollowing
            ? (theirData.followers || []).filter(uid => uid !== user.uid)
            : [...(theirData.followers || []), user.uid];

        await setDoc(myRef, { following: updatedMyFollowing }, { merge: true });
        await setDoc(theirRef, { followers: updatedTheirFollowers }, { merge: true });

        setIsFollowing(!isCurrentlyFollowing);
        setFollowers(updatedTheirFollowers);
        if (isMyProfile) {
            setFollowing(updatedMyFollowing);
        }
    };

    const fetchUsernames = async (uids) => {
        if (uids.length === 0) return [];

        const usersRef = collection(db, 'users');
        const chunks = [];

        for (let i = 0; i < uids.length; i += 10) {
            chunks.push(uids.slice(i, i + 10));
        }

        const promises = chunks.map(chunk => {
            const q = query(usersRef, where('__name__', 'in', chunk));
            return getDocs(q);
        });

        const snapshots = await Promise.all(promises);
        const allUsers = [];

        snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                allUsers.push({ uid: doc.id, username: doc.data().username || 'Unnamed' });
            });
        });

        return allUsers;
    };

    const openFollowerModal = async () => {
        const users = await fetchUsernames(followers);
        setFollowerUsers(users);
        setShowFollowerModal(true);
    };

    const openFollowingModal = async () => {
        const users = await fetchUsernames(following);
        setFollowingUsers(users);
        setShowFollowingModal(true);
    };

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
                        <div className="follow-row">
                            <p className="follow-counts">
                                <strong className="clickable" onClick={openFollowerModal}>
                                    {followers.length}
                                </strong> Followers &nbsp;|&nbsp;
                                <strong className="clickable" onClick={openFollowingModal}>
                                    {following.length}
                                </strong> Following
                            </p>
                            {!isMyProfile && user && (
                                <button className="follow-button" onClick={handleFollowToggle}>
                                    {isFollowing ? 'Unfollow' : 'Follow'}
                                </button>
                            )}
                        </div>
                        
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
                            <p>No recipes saved yet.</p>
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
                            <p>No recipes rated yet.</p>
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
                            <p>No posts liked yet.</p>
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
                            <p>No posts created yet.</p>
                        )}
                    </div>
                </div>
                {showFollowerModal && (
                    <div className="modal-backdrop" onClick={() => setShowFollowerModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Followers</h3>
                        {followerUsers.length > 0 ? (
                            <ul>
                                {followerUsers.map((user, i) => (
                                <li
                                    key={i}
                                    className="clickable"
                                    onClick={() => {
                                        setShowFollowerModal(false);
                                        navigate(`/profile/${user.uid}`);
                                    }}
                                >
                                    {user.username}
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p>No followers yet.</p>
                        )}
                        </div>
                    </div>
                )}

                {showFollowingModal && (
                    <div className="modal-backdrop" onClick={() => setShowFollowingModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Following</h3>
                        {followingUsers.length > 0 ? (
                            <ul>
                                {followingUsers.map((user, i) => (
                                <li
                                    key={i}
                                    className="clickable"
                                    onClick={() => {
                                        setShowFollowingModal(false);
                                        navigate(`/profile/${user.uid}`);
                                    }}
                                >
                                    {user.username}
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p>Not following anyone yet.</p>
                        )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfilePage;