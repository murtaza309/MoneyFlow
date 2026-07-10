import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// MoneyFlow Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDoL9XG6YG8e5BTUYKnjjxx1jwV56G2BXg",
  authDomain: "moneyflow-d77c5.firebaseapp.com",
  projectId: "moneyflow-d77c5",
  storageBucket: "moneyflow-d77c5.firebasestorage.app",
  messagingSenderId: "1072187432606",
  appId: "1:1072187432606:web:0659764d6d5274cc1ee58f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;