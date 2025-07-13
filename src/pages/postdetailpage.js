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
                setPost(postSnap.data());
            }
        };
        fetchPost();
    }, [postId]);

    const handleLike = async () => {
        const postRef = doc(db, 'communityPosts', postId);
        await updateDoc(postRef, {
            likes: arrayUnion(user.uid)
        });
        setPost(prev => ({ ...prev, likes: [...(prev.likes || []), user.uid] }));
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;
        const postRef = doc(db, 'communityPosts', postId);
        const comment = {
            text: newComment,
            userId: user.uid,
            username: user.displayName || 'Anonymous',
            createdAt: new Date().toISOString() //need change?
        };
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
                <img
                    src={post.imageUrl}
                    alt="post"
                    className="post-detail-image"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default.jpg';
                    }}
                />
                <div className="post-detail-content">
                    <h2>{post.caption}</h2>
                    <p className="author">By {post.username}</p>
                    <p className="timestamp">{formattedDate}</p>
                    <p className="desc">{post.description}</p>

                    <div className="post-detail-actions">
                        <button onClick={handleLike}>
                            ❤️ {post.likes ? post.likes.length : 0}
                        </button>
                    </div>

                    <div className="comment-section">
                        <h3>Comments</h3>
                        <div className="comment-list">
                            {(post.comments || []).map((c, i) => (
                                <div key={i} className="comment">
                                    <strong>{c.username}</strong>: {c.text}
                                </div>
                            ))}
                        </div>
                        <div className="comment-form">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button onClick={handleComment}>Post</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PostDetailPage;