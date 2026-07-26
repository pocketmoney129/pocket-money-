import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwnOzwIensIme3Wj8Qj-kleU9Ax6ReS2A",
  authDomain: "pocket-money-18e32.firebaseapp.com",
  projectId: "pocket-money-18e32",
  storageBucket: "pocket-money-18e32.firebasestorage.app",
  messagingSenderId: "914675837934",
  appId: "1:914675837934:web:98a98c861facd4bbe4bcff",
  measurementId: "G-LLRH7TLR8L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
