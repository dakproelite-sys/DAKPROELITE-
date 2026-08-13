import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDR7INHKaazaqZt-xIcjk10JFiy58uXKO8",
  authDomain: "dakproelite.firebaseapp.com",
  databaseURL: "https://dakproelite-default-rtdb.firebaseio.com",
  projectId: "dakproelite",
  storageBucket: "dakproelite.firebasestorage.app",
  messagingSenderId: "580591769206",
  appId: "1:580591769206:web:4f67f8aadbf3d051087157"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Fonction principale appelée par le formulaire de connexion/inscription
window.gererAuthentification = async () => {
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    
    // Détecte si on est en mode inscription ou connexion
    const isRegistering = document.getElementById("nameGroup").style.display !== "none";

    try {
        if (isRegistering) {
            const nomComplet = document.getElementById("nomInput").value.trim();
            const confirmPassword = document.getElementById("confirmPasswordInput").value;
            const role = document.getElementById("roleSelect").value;

            if (password !== confirmPassword) {
                alert("Les mots de passe ne correspondent pas.");
                return;
            }

            // 1. Création du compte dans Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Enregistrement des données de profil dans Firestore (collection "vendeurs")
            await setDoc(doc(db, "vendeurs", user.uid), {
                uid: user.uid,
                nomComplet: nomComplet,
                email: email,
                role: role,
                createdAt: new Date().toISOString()
            });

            // 3. Redirection unique vers le fichier de routage
            window.location.replace("redirect.html");

        } else {
            // Connexion simple
            await signInWithEmailAndPassword(auth, email, password);
            
            // Redirection unique vers le fichier de routage
            window.location.replace("redirect.html");
        }

    } catch (error) {
        console.error("Erreur d'authentification :", error);
        alert("Erreur : " + error.message);
    }
};

// Fonction pour la réinitialisation du mot de passe
window.reinitialiserMotDePasse = async () => {
    const email = document.getElementById("emailInput").value.trim();
    if (!email) {
        alert("Veuillez d'abord saisir votre adresse email.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Un e-mail de réinitialisation a été envoyé à : " + email);
    } catch (error) {
        console.error("Erreur de réinitialisation :", error);
        alert("Erreur : " + error.message);
    }
};
