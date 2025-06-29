import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHN-SOhcyHagIWnS3LJr6bZ4PLn3-YqgY",
  authDomain: "budgetbites-3e649.firebaseapp.com",
  projectId: "budgetbites-3e649",
  storageBucket: "budgetbites-3e649.firebasestorage.app",
  messagingSenderId: "575781681228",
  appId: "1:575781681228:web:984d8e2f2475d455c3dce9"
};

// initialize firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);