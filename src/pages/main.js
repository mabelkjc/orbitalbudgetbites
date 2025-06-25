import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './main.css';

const dietaryOptions = ['Vegetarian', 'Vegan', 'Keto', 'Halal'];
const allergyOptions = ['Dairy', 'Nuts', 'Shellfish'];
const restrictionOptions = ['Gluten', 'Pork', 'Red meat'];

function MainPage() {
  const [username, setUsername] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [restrictions, setRestrictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const docSnap = await getDoc(ref);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsername(data.username || '');
          setPreferences(data.dietaryPreferences || []);
          setAllergies(data.allergies || []);
          setRestrictions(data.restrictions || []);
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const toggleOption = (option, setFunc, currentList) => {
    if (option === 'None') {
      setFunc(['None']);
    } else {
      const updated = currentList.includes(option)
        ? currentList.filter((item) => item !== option)
        : [...currentList.filter((i) => i !== 'None'), option];
      setFunc(updated);
    }
  };

  const saveChanges = async () => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), {
        dietaryPreferences: preferences,
        allergies: allergies,
        restrictions: restrictions
      }, { merge: true });

      alert('Preferences saved!');
      navigate('/home');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="main-page">
      <h2>Welcome, {username}</h2>

      <section>
        <h3>Dietary Preferences</h3>
        {['None', ...dietaryOptions].map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={preferences.includes(item)}
              onChange={() => toggleOption(item, setPreferences, preferences)}
            />
            {item}
          </label>
        ))}
      </section>

      <section>
        <h3>Allergies</h3>
        {['None', ...allergyOptions].map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={allergies.includes(item)}
              onChange={() => toggleOption(item, setAllergies, allergies)}
            />
            {item}
          </label>
        ))}
      </section>

      <section>
        <h3>Restrictions</h3>
        {['None', ...restrictionOptions].map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={restrictions.includes(item)}
              onChange={() => toggleOption(item, setRestrictions, restrictions)}
            />
            {item}
          </label>
        ))}
      </section>

      <button onClick={saveChanges} className="save-button">Save Preferences</button>
    </div>
  );
}

export default MainPage;
