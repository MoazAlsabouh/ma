import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, updateDoc, query, where, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAj-kNPF0frnXd8Vo7enpLBYwnv3NnF4VY",
  authDomain: "manasik-db129.firebaseapp.com",
  projectId: "manasik-db129",
  storageBucket: "manasik-db129.firebasestorage.app",
  messagingSenderId: "880892557697",
  appId: "1:880892557697:web:98d5869472bb4883c91080"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, onAuthStateChanged, signOut, confirmPasswordReset, collection, getDocs, getDoc, doc, setDoc, updateDoc, query, where, addDoc, deleteDoc };
