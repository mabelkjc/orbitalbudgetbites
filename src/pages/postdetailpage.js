import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Navbar from '../components/navbar';
import './postdetailpage.css';

function PostDetailPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    const [post, setPost] = useState(null);
    const [newComment, setNewComment] = useState('');
    
    useEffect(() => {
        const fetchPost = async () => {
            const postRef = doc(db, 'communityPosts', postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                const postData = postSnap.data();
                if (!Array.isArray(postData.likes)) {
                    postData.likes = [];
                }
                setPost(postData);
            }
        };
        fetchPost();
    }, [postId]);

    const toggleLikePost = async () => {
        if (!user || !post) return;

        const postRef = doc(db, 'communityPosts', postId);
        const hasLiked = post.likes?.includes(user.uid);

        let updatedLikes;
        if (hasLiked) {
            updatedLikes = post.likes.filter(uid => uid !== user.uid);
        } else {
            updatedLikes = [...(post.likes || []), user.uid];
        }

        await updateDoc(postRef, { likes: updatedLikes });

        setPost(prev => ({
            ...prev,
            likes: updatedLikes,
        }));
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;

        let username = '';
        try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                username = userSnap.data().username || username;
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }

        const comment = {
            text: newComment,
            userId: user.uid,
            username: username,
            createdAt: new Date().toISOString()
        };

        const postRef = doc(db, 'communityPosts', postId);
        await updateDoc(postRef, {
            comments: arrayUnion(comment)
        });

        setPost(prev => ({
            ...prev,
            comments: [...(prev.comments || []), comment]
        }));

        setNewComment('');
    };

    if (!post) return <div>Loading...</div>;

    const formattedDate = post.createdAt?.toDate
        ? `${post.createdAt.toDate().toLocaleDateString()} ${post.createdAt.toDate().toLocaleTimeString()}`
        : 'Just now';

    return (
        <div className="post-detail-wrapper">
            <Navbar />
            <div className="post-detail-container">
                <button className="back-button" onClick={() => navigate(-1)}>← Back</button>

                <div className="post-header">
                    <div className="author-info">
                        <img
                            src={post.profilePicture || '/avatars/default-profile.png'}
                            alt="profile"
                            className="author-image"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/avatars/default-profile.png';
                            }}
                        />
                        <div>
                            <p className="author">{post.username}</p>
                            <p className="timestamp">{formattedDate}</p>
                        </div>
                    </div>

                    <div className="like-container">
                        <button className="like-button" onClick={toggleLikePost}>
                            {post.likes.includes(user?.uid) ? 'Unlike' : 'Like'}
                        </button>
                        <span className="like-count">{post.likes.length} likes</span>
                    </div>
                </div>

                <div className="post-body">
                    <img
                        src={post.imageUrl}
                        alt="post"
                        className="post-detail-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/silly.png';
                        }}
                    />
                    <div className="post-detail-content">
                        <h2>{post.caption}</h2> 
                        <p className="desc">{post.description}</p>
                    </div>
                </div>

                <div className="comment-section">
                    <h3>Comments ({(post.comments || []).length})</h3>
                    <div className="comment-form">
                        <textarea
                            placeholder="What did you feel about this post?"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="comment-buttons">
                            <button onClick={() => setNewComment('')}>Clear</button>
                            <button className="submit-comment" onClick={handleComment}>Submit</button>
                        </div>
                    </div>
                    <div className="comment-list">
                        {(post.comments || []).map((c, i) => (
                            <div key={i} className="comment-card">
                                <strong>{c.username}</strong>
                                <div className="comment-date">
                                    {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString()}
                                </div>
                                <p>{c.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PostDetailPage;