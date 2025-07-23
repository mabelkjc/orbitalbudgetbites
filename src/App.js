import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login.js";
import Registration from "./pages/registration.js";
import Main from './pages/main.js';
import HomePage from './pages/home.js';
import RecipeDetail from './pages/recipedetailpage.js';
import RecipeIndexPage from './pages/recipeindexpage.js';
import ProfilePage from './pages/profile.js';
import CommunityPage from "./pages/community.js";
import FindStores from './pages/findstores.js';
import PostDetailPage from "./pages/postdetailpage.js";

function App() {
    return (
        <Router>
            <div className="container mt-4">
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/registration" element={<Registration />} />
                    <Route path="/preferences" element={<Main />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/preferences" element={<Main />} />
                    <Route path="/profile/:userId" element={<ProfilePage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/post/:postId" element={<PostDetailPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/recipe/:id" element={<RecipeDetail />} />
                    <Route path="/recipeindex" element={<RecipeIndexPage />} />
                    <Route path="/find-stores" element={<FindStores />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;




