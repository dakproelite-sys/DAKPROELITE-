// ============================================================
// DAKPRO ÉLITE
// CONFIGURATION CENTRALE FIREBASE
// Base principale : Firebase Realtime Database
// ============================================================

// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";


// ============================================================
// CONFIGURATION FIREBASE DAKPRO ÉLITE
// ============================================================

const firebaseConfig = {
    apiKey: "REMPLACEZ_PAR_VOTRE_API_KEY",
    authDomain: "dakpro-elite.firebaseapp.com",
    databaseURL: "https://dakpro-elite-default-rtdb.firebaseio.com",
    projectId: "dakpro-elite",
    storageBucket: "dakpro-elite.firebasestorage.app",
    messagingSenderId: "REMPLACEZ_PAR_VOTRE_MESSAGING_SENDER_ID",
    appId: "REMPLACEZ_PAR_VOTRE_APP_ID"
};


// ============================================================
// INITIALISATION FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// SERVICES PRINCIPAUX
// ============================================================

// Authentification
const auth = getAuth(app);

// Firebase Realtime Database
const db = getDatabase(app);

// Firebase Storage
const storage = getStorage(app);


// ============================================================
// EXPORTS
// Tous les autres fichiers utiliseront cette configuration.
// ============================================================

export {
    app,
    auth,
    db,
    storage
};


// ============================================================
// DISPONIBILITÉ GLOBALE
// Utile pour le diagnostic et certaines pages existantes.
// ============================================================

window.DAKPRO_FIREBASE = {
    app,
    auth,
    db,
    storage
};

console.log("✅ DAKPRO ÉLITE : Firebase initialisé");
console.log("✅ Realtime Database : connecté");
console.log("✅ Authentification Firebase : prête");
console.log("✅ Storage Firebase : prêt");