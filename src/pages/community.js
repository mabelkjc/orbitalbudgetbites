import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import PostCard from '../components/postcard';
import uploadToCloudinary from '../cloudinaryUpload';
import { collection, addDoc, getDocs, getDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
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

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const postsArray = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setPosts(postsArray);
            } catch (error) {
                console.error('Failed to load posts:', error);
            } finally {
                setLoadingPosts(false);
            }
        };
        fetchPosts();
    }, []);

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
        let profilePicture = '/default-profile.png';
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

        console.log('Image uploaded to:', imageUrl); // to remove
    };

    if (loadingPosts) return <div>Loading...</div>;

    return (
        <div className="community-wrapper">
        <Navbar />
        <div className="community-container">
            <h2 className="community-header">Community</h2>

            <div className="post-grid">
                {posts.length === 0 ? (
                    <p className="no-posts-message">There are no posts found.</p>
                ) : (
                    posts.slice(0, visiblePosts).map(post => (
                        <PostCard key={post.id} post={post} />
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