import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import './navbar.css';

function Navbar() {
    const navigate = useNavigate();
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [user] = useAuthState(auth);
    const [profilePic, setProfilePic] = useState('/default-profile.png');

    const handleLogout = async () => {
        try {
            await signOut(auth);
            sessionStorage.removeItem('searchState');
            localStorage.removeItem('searchTerm');
            localStorage.removeItem('sortBy');
            navigate('/login');
        } catch (error) {
              console.error('Logout failed:', error);
        }
    };

    useEffect(() => {
        const fetchProfilePicture = async () => {
            if (user) {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.profilePicture) {
                            setProfilePic(data.profilePicture);
                        }
                    }
                } catch (error) {
                    console.error("Failed to load profile picture:", error);
                }
            }
        };
        fetchProfilePicture();
    }, [user]);

    return (
        <div className="top-bar">
            <nav className="nav-links">
                <Link to="/community">Community</Link>
                <Link to="/recipeindex">Recipe Index</Link>
            </nav>
            <Link to="/home" className="logo">
                <img src="/budgetbitesfinal.png" alt="Budget Bites Logo" />
            </Link>
            <div className="profile-menu">
                <img src={profilePic} alt="User Avatar" className="user-icon" />
                <button className="dropbtn" onClick={() => setDropdownVisible(!dropdownVisible)}>▼</button>
                {dropdownVisible && (
                <div className="dropdown-content">
                    <Link to="/profile"state={{ from: window.location.pathname === "/recipeindex" ? "recipeindex" : "home" }}>
                        Profile
                    </Link>
                    <button onClick={handleLogout}>Logout</button>
                </div>
                )}
            </div>
        </div>
    );
}

export default Navbar;
