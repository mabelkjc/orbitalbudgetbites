import React from 'react';
import { useNavigate } from 'react-router-dom';
import './postcard.css';

const PostCard = ({ post }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/post/${post.id}`);
    };

    const formattedDate = post.createdAt?.toDate
        ? `${post.createdAt.toDate().toLocaleDateString()} ${post.createdAt.toDate().toLocaleTimeString()}`
        : 'Just now';

    return (
        <div className="post-card-link" onClick={handleClick}>
            <div className="post-card">
                <img
                    className="post-card-image"
                    src={post.imageUrl}
                    alt={post.caption}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default.jpg';
                    }}
                />
                <div className="post-card-content">
                    <div className="post-card-header">
                        <div className="post-card-caption">{post.caption}</div>
                        <div className="post-card-author">{post.username}</div>
                    </div>
                    <div className="post-card-footer">
                        <div className="post-card-date">{formattedDate}</div>
                        <div className="post-card-stats">
                            <span>❤️ 0</span>
                            <span>💬 0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
