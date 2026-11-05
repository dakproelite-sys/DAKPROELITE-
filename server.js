const express = require('express');
const app = express();

app.use(express.json());

// 1. Initialisation de Firebase Admin pour la Realtime Database
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
        }),
        databaseURL: "https://dakproelite-default-rtdb.firebaseio.com" // Ton URL Realtime Database
    });
}

// Instance de la Realtime Database
const db = admin.database();

// 2. Importation et injection des routes CJdropshipping
const cjRoutes = require('./cj-routes.js');
cjRoutes(app, db);

// 3. Export obligatoire pour les Functions Vercel
module.exports = app;
