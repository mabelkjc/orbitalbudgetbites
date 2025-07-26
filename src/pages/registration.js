import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './registration.css';

function Registration() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCred.user;

            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                username: username,
                dietaryPreferences: [],
                allergies: [],
                restrictions: [],
                followers: [],
                following: []
            });

            alert("Registered successfully!");
            navigate('/');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="registration">
            <form className="registration-form" onSubmit={handleSubmit}>
                <h1>Registration</h1>
                <label htmlFor="username">Username</label>
                <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />

                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

                <button type="submit" className="submitInfo">Register</button>
            </form>
        </div>
    );
}

export default Registration;