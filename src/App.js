import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login.js";
import Registration from "./pages/registration.js";
import Main from './pages/main.js';
import HomePage from './pages/home';
import RecipeDetail from './pages/recipedetailpage.js';
import RecipeIndexPage from './pages/recipeindexpage.js';
import ProfilePage from './pages/profile';

function App() {
  return (
    <Router>
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/preferences" element={<Main />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/recipeindex" element={<RecipeIndexPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;




