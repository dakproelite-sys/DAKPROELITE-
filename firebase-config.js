// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Ajoutez ceci si vous utilisez l'authentification
import { getDatabase } from "firebase/database"; // Ajoutez ceci si vous utilisez la Realtime Database

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDR7INHKaazaqZt-xIcjk10JFiy58uXKO8",
  authDomain: "dakproelite.firebaseapp.com",
  databaseURL: "https://dakproelite-default-rtdb.firebaseio.com",
  projectId: "dakproelite",
  storageBucket: "dakproelite.firebasestorage.app",
  messagingSenderId: "580591769206",
  appId: "1:580591769206:web:4f67f8aadbf3d051087157"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialisez vos services si nécessaire :
// export const auth = getAuth(app);
// export const database = getDatabase(app);
