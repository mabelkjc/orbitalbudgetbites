import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './home.css';

function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
  if (!auth.currentUser) {
    navigate('/login');
  }
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="home-wrapper">
      <nav className="top-nav">
        <div className="logo">BudgetBites</div>
        <button className="logout-btn" onClick={handleLogout}>Log Out</button>
      </nav>

      <div className="home-container">
        <h1>Welcome to BudgetBites!</h1>
        <p>You’re logged in.</p>
      </div>
    </div>
  );
}

export default HomePage;