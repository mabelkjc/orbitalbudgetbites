import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import './community.css';

function CommunityPage() {
    const [posts, setPosts] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [caption, setCaption] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);


    useEffect(() => {
        // placeholder for getting posts from firestore
        setPosts([]);
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

    const handleSubmitPost = () => {
        // placeholder for uploading to firestore etc
        console.log({ selectedFile, caption, description });
    };

    return (
        <div className="community-wrapper">
        <Navbar />
        <div className="community-container">
            <h2>Community</h2>

            <div className="post-grid">
                {/* placeholder for posts display. consts above*/}
                <p className="no-posts-message">There are no posts found.</p>
            </div>

            <button className="load-more-btn">Load more posts</button> {/* unfinished */}

            <div className="create-post">
                <h3>Create a Post</h3>
                <label htmlFor="file-upload">Upload your image (.jpg / .png)</label>
                <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} />

                {selectedFile && <img src={selectedFile} alt="Preview" className="preview-image" />}
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
                    <button onClick={() => { setCaption(''); setDescription(''); setSelectedFile(null); }}>
                    Clear
                    </button>
                    <button className="submit-btn" onClick={handleSubmitPost}>
                    Submit
                    </button>
                </div>
                <p>Post creation is a work in progress.</p>
            </div>
        </div>
        </div>
    );
}

export default CommunityPage;