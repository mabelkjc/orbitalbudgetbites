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
  const [otherPrefs, setOtherPrefs] = useState([]);
  const [newOtherPref, setNewOtherPref] = useState('');
  const [otherAllergies, setOtherAllergies] = useState([]);
  const [newOtherAllergy, setNewOtherAllergy] = useState('');
  const [otherRestrictions, setOtherRestrictions] = useState([]);
  const [newOtherRestriction, setNewOtherRestriction] = useState('');
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

          const preferencesRaw = data.dietaryPreferences || [];
          const prefsOther = preferencesRaw.filter(p => p.startsWith('Other: ')).map(p => p.replace('Other: ', ''));
          setPreferences(preferencesRaw.filter(p => !p.startsWith('Other: ')));
          setOtherPrefs(prefsOther);

          const allergiesRaw = data.allergies || [];
          const allergyOther = allergiesRaw.filter(a => a.startsWith('Other: ')).map(a => a.replace('Other: ', ''));
          setAllergies(allergiesRaw.filter(a => !a.startsWith('Other: ')));
          setOtherAllergies(allergyOther);

          const restrictionsRaw = data.restrictions || [];
          const restrictOther = restrictionsRaw.filter(r => r.startsWith('Other: ')).map(r => r.replace('Other: ', ''));
          setRestrictions(restrictionsRaw.filter(r => !r.startsWith('Other: ')));
          setOtherRestrictions(restrictOther);
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

  const toProperCase = (text) => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const addEntry = (value, list, setList, setter) => {
    const trimmed = toProperCase(value.trim());
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setter('');
    }
  };

  const removeEntry = (value, list, setList) => {
    setList(list.filter(item => item !== value));
  };

  const saveChanges = async () => {
    const finalPrefs = [...preferences, ...otherPrefs.map(p => `Other: ${p}`)];
    const finalAllergies = [...allergies, ...otherAllergies.map(a => `Other: ${a}`)];
    const finalRestrictions = [...restrictions, ...otherRestrictions.map(r => `Other: ${r}`)];

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
        <div className="other-entry-row">
          <input
            type="text"
            placeholder="Add other preference"
            value={newOtherPref}
            onChange={(e) => setNewOtherPref(e.target.value)}
          />
          <button type="button" className="wide-btn" onClick={() => addEntry(newOtherPref, otherPrefs, setOtherPrefs, setNewOtherPref)}>Add</button>
        </div>
        <div className="pill-grid">
          {otherPrefs.map((p) => (
            <span key={p} className="pill">
              {p} <button className="pill-close" onClick={() => removeEntry(p, otherPrefs, setOtherPrefs)}>×</button>
            </span>
          ))}
        </div>
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
        <div className="other-entry-row">
          <input
            type="text"
            placeholder="Add other allergy"
            value={newOtherAllergy}
            onChange={(e) => setNewOtherAllergy(e.target.value)}
          />
          <button type="button" className="wide-btn" onClick={() => addEntry(newOtherAllergy, otherAllergies, setOtherAllergies, setNewOtherAllergy)}>Add</button>
        </div>
        <div className="pill-grid">
          {otherAllergies.map((a) => (
            <span key={a} className="pill">
              {a} <button className="pill-close" onClick={() => removeEntry(a, otherAllergies, setOtherAllergies)}>×</button>
            </span>
          ))}
        </div>
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
        <div className="other-entry-row">
          <input
            type="text"
            placeholder="Add other restriction"
            value={newOtherRestriction}
            onChange={(e) => setNewOtherRestriction(e.target.value)}
          />
          <button type="button" className="wide-btn" onClick={() => addEntry(newOtherRestriction, otherRestrictions, setOtherRestrictions, setNewOtherRestriction)}>Add</button>
        </div>
        <div className="pill-grid">
          {otherRestrictions.map((r) => (
            <span key={r} className="pill">
              {r} <button className="pill-close" onClick={() => removeEntry(r, otherRestrictions, setOtherRestrictions)}>×</button>
            </span>
          ))}
        </div>
      </section>

      <button onClick={saveChanges} className="save-button">Save Preferences</button>
    </div>
  );
}

export default MainPage;