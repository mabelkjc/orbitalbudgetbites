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
          (data.dietaryPreferences && data.dietaryPreferences.length > 0) ||
          (data.allergies && data.allergies.length > 0) ||
          (data.restrictions && data.restrictions.length > 0);

        if (hasPreferences) {
          navigate('/home');
        } else {
          navigate('/main');
        }
      } else {
        navigate('/main');
      }
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="overall-page">
      <form className="login-section" onSubmit={handleLogin}>
        <div className="details">
          <h1>Log In</h1>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="login-btn">Log In</button>
        </div>
      </form>

      <div className="signup-section">
        <div className="group">
          <h2>New to BudgetBites?</h2>
          <p>Join us today and start planning delicious, budget-friendly meals with ease!</p>
          <Link to="/registration">
            <button className="signup-btn">Sign Up</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
