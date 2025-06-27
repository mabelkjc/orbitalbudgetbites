import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './login.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      const ref = doc(db, 'users', user.uid);
      const docSnap = await getDoc(ref);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const hasPreferences =
          (data.dietaryPreferences?.length > 0) ||
          (data.allergies?.length > 0) ||
          (data.restrictions?.length > 0);

        if (hasPreferences) {
          navigate('/home');
        } else {
          navigate('/profile');
        }
      } else {
        navigate('/profile');
      }
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="landing-container">
      <header className="landing-header">
        <img src="/budgetbites-nobg.png" alt="Budget Bites Logo" className="landing-logo" />
        <h1 className="headline">Tired of wondering what to cook?</h1>
        <div className="tagline">
          <p>Let <span className="highlight">Budget Bites</span> turn your fridge into a feast.</p>
          <p>Quick, smart, budget-friendly meal ideas — <span className="highlight">just for you.</span></p>
        </div>
        <Link to="/registration">
          <button className="cta-button">Get Started Free</button>
        </Link>
      </header>

      <section className="features-section">
        <div className="features">
          <div className="feature">
            <h3>🥕 Smart Recipe Suggestions</h3>
            <p>Get instant, personalised meal ideas based on what’s in your fridge.</p>
          </div>
          <div className="feature">
            <h3>🛒 Grocery Finder</h3>
            <p>Missing something? Find the nearest store with our Google Maps tool.</p>
          </div>
          <div className="feature">
            <h3>👩‍🍳 Share & Discover</h3>
            <p>Upload your creations, rate recipes, and exchange tips with friends.</p>
          </div>
        </div>
      </section>

      <section className="login-section">
        <h2>Already have an account?</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="login-btn">Log In</button>
        </form>
      </section>

      <footer className="bottom-cta">
        <p className="confidence-text">
          Built by students. Loved by students.
        </p>
      </footer>
    </div>
  );
}

export default LoginPage;

