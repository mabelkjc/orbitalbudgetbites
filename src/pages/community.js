import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar.js';
import PostCard from '../components/postcard.js';
import uploadToCloudinary from '../cloudinaryUpload.js';
import { collection, addDoc, getDocs, getDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { useAuthState } from 'react-firebase-hooks/auth/dist/index.esm.js';
import './community.css';

function CommunityPage() {
    const [posts, setPosts] = useState([]);
    const [caption, setCaption] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [user] = useAuthState(auth);
    const [visiblePosts, setVisiblePosts] = useState(6);
    const [sortBy, setSortBy] = useState(() => localStorage.getItem('communitySortBy') || 'Newest');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [showFollowingOnly, setShowFollowingOnly] = useState(() => {
        return localStorage.getItem('showFollowingOnly') === 'true';
    });

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                let postsArray = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                if (showFollowingOnly && user) {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const followingList = userSnap.data().following || [];
                        const followingUids = followingList.map(f =>
                            typeof f === 'object' ? f.uid : f
                        );
                        postsArray = postsArray.filter(post =>
                            followingUids.includes(post.userId)
                        );
                    }
                }

                const sorted = [...postsArray];
                if (sortBy === 'Newest') {
                    sorted.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
                } else if (sortBy === 'Oldest') {
                    sorted.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
                } else if (sortBy === 'Most Likes') {
                    sorted.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
                } else if (sortBy === 'Most Comments') {
                    sorted.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
                }

                setPosts(sorted);
            } catch (error) {
                console.error('Failed to load posts:', error);
            } finally {
                setLoadingPosts(false);
            }
        };
        fetchPosts();
    }, [sortBy, showFollowingOnly, user]);

    useEffect(() => {
        const savedCount = sessionStorage.getItem('visiblePosts');
        const anchorPostId = sessionStorage.getItem('anchorPostId');

        if (savedCount) {
            setVisiblePosts(parseInt(savedCount));
        }

        if (anchorPostId) {
            const scrollToAnchor = () => {
                const element = document.getElementById(`post-${anchorPostId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'auto', block: 'start' });
                }
            };
            const timeout = setTimeout(scrollToAnchor, 150);
            return () => clearTimeout(timeout);
        }
    }, []);

    useEffect(() => {
        const clearSession = () => {
            sessionStorage.removeItem('visiblePosts');
            sessionStorage.removeItem('scrollY');
            sessionStorage.removeItem('anchorPostId');
        };
        window.addEventListener('beforeunload', clearSession);
        return () => window.removeEventListener('beforeunload', clearSession);
    }, []);

    const handleToggleFollowing = (e) => {
        const value = e.target.checked;
        setShowFollowingOnly(value);
        localStorage.setItem('showFollowingOnly', value);
    };

    const handleSortChange = (value) => {
        setSortBy(value);
        localStorage.setItem('communitySortBy', value);
        setDropdownVisible(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleCancelImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmitPost = async () => {
        if (!imageFile) {
            alert('Please upload an image.');
            return;
        }

        const imageUrl = await uploadToCloudinary(imageFile);
        if (!imageUrl) {
            alert('Image upload failed.');
            return;
        }

        let username = '';
        let profilePicture = '/avatars/default-profile.png';
        try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                username = data.username || username;
                profilePicture = data.profilePicture || profilePicture;
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }

        const newPost = {
            caption,
            description,
            imageUrl,
            createdAt: serverTimestamp(),
            userId: user.uid,
            username: username,
            profilePicture: profilePicture,
        };

        try {
            await addDoc(collection(db, 'communityPosts'), newPost);
            alert('Post submitted!');

            setCaption('');
            setDescription('');
            setImageFile(null);
            setImagePreview(null);

            const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const postsArray = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPosts(postsArray);
        } catch (error) {
            console.error('Failed to save post:', error);
            alert('Failed to save post.');
        }

    };

    if (loadingPosts) return <div>Loading...</div>;

    return (
        <div className="community-wrapper">
        <Navbar />
        <div className="community-container">
            <h2 className="community-header">Community</h2>

            <div className="community-sort-wrapper">
                <span className="sort-label">Sort by:</span>
                <button className="drop-btn" onClick={() => setDropdownVisible(!dropdownVisible)}>
                    {sortBy} ▼
                </button>
                {dropdownVisible && (
                    <div className="dropdown-content">
                        <button onClick={() => handleSortChange('Newest')}>Newest</button>
                        <button onClick={() => handleSortChange('Oldest')}>Oldest</button>
                        <button onClick={() => handleSortChange('Most Likes')}>Most Likes</button>
                        <button onClick={() => handleSortChange('Most Comments')}>Most Comments</button>
                    </div>
                )}
            </div>
            <div className="community-toggle-wrapper">
                <label>
                    <input
                        type="checkbox"
                        checked={showFollowingOnly}
                        onChange={handleToggleFollowing}
                    />
                    &nbsp;Only show posts from users I follow
                </label>
            </div>

            <div className="post-grid">
                {posts.length === 0 ? (
                    <p className="no-posts-message">There are no posts found.</p>
                ) : (
                    posts.slice(0, visiblePosts).map(post => (
                        <PostCard key={post.id} post={post} visiblePosts={visiblePosts}/>
                    ))
                )}
            </div>

            {visiblePosts < posts.length && (
                <button
                    className="load-more-btn"
                    onClick={() => setVisiblePosts(prev => prev + 6)}
                >
                    Load more posts
                </button>
            )}

            <div className="create-post">
                <h3>Create a Post</h3>

                <label htmlFor="file-upload">Upload your image (.jpg / .jpeg / .png / .webp)</label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                <div className="image-preview-container">
                    {imagePreview && (
                        <div className="preview-wrapper">
                        <img src={imagePreview} alt="Preview" className="preview-image" />
                        <button type="button" className="cancel-button" onClick={handleCancelImage}>✖</button>
                        </div>
                    )}
                </div>

                <input
                    type="text"
                    placeholder="Title your post"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                />
                <textarea
                    className="desc-box"
                    placeholder="Write about your experience making the recipe..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <div className="button-row">
                    <button onClick={() => {
                        setCaption('');
                        setDescription('');
                        setImageFile(null);
                        setImagePreview(null)
                    }}>
                        Clear
                    </button>
                    <button className="submit-btn" onClick={handleSubmitPost}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
        </div>
    );
}

export default CommunityPage;