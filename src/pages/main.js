import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './main.css';

const dietaryOptions = ['Vegetarian', 'Vegan', 'Keto', 'Halal'];
const allergyOptions = ['Dairy', 'Peanuts', 'Shellfish'];
const restrictionOptions = ['Gluten-Free', 'Low Sodium', 'No Pork'];

function MainPage() {
  const [username, setUsername] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [restrictions, setRestrictions] = useState([]);
  const [otherPrefs, setOtherPrefs] = useState('');
  const [otherAllergies, setOtherAllergies] = useState('');
  const [otherRestrictions, setOtherRestrictions] = useState('');
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
    const finalPrefs = [...preferences];
    const finalAllergies = [...allergies];
    const finalRestrictions = [...restrictions];

    if (otherPrefs.trim()) finalPrefs.push(`Other: ${otherPrefs}`);
    if (otherAllergies.trim()) finalAllergies.push(`Other: ${otherAllergies}`);
    if (otherRestrictions.trim()) finalRestrictions.push(`Other: ${otherRestrictions}`);

    if (user) {
      await setDoc(doc(db, 'users', user.uid), {
        dietaryPreferences: finalPrefs,
        allergies: finalAllergies,
        restrictions: finalRestrictions
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
        <input
          type="text"
          placeholder="Other preference"
          value={otherPrefs}
          onChange={(e) => setOtherPrefs(e.target.value)}
        />
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
        <input
          type="text"
          placeholder="Other allergy"
          value={otherAllergies}
          onChange={(e) => setOtherAllergies(e.target.value)}
        />
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
        <input
          type="text"
          placeholder="Other restriction"
          value={otherRestrictions}
          onChange={(e) => setOtherRestrictions(e.target.value)}
        />
      </section>

      <button onClick={saveChanges}>Save Preferences</button>
    </div>
  );
}

export default MainPage;