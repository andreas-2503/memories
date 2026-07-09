// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiLH5J5p6NaAPaHwlkIwT-vluhY3rJf-8",
  authDomain: "my-memories-2503.firebaseapp.com",
  projectId: "my-memories-2503",
  storageBucket: "my-memories-2503.firebasestorage.app",
  messagingSenderId: "17208965924",
  appId: "1:17208965924:web:9ac895b2cf1ee207bb51b1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);