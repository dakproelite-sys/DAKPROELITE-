import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- VOS VRAIES CONFIGURATIONS FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDR7INHKaazaqZt-xIcjk10JFiy58uXKO8",
  authDomain: "dakproelite.firebaseapp.com",
  databaseURL: "https://dakproelite-default-rtdb.firebaseio.com",
  projectId: "dakproelite",
  storageBucket: "dakproelite.firebasestorage.app",
  messagingSenderId: "580591769206",
  appId: "1:580591769206:web:4f67f8aadbf3d051087157"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Fonction principale appelée lors de la soumission du formulaire
window.gererAuthentification = async function() {
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;

    // Détection automatique du mode (Connexion ou Inscription) selon l'affichage du champ nom
    const estEnModeInscription = document.getElementById("nameGroup").style.display === "block";

    if (estEnModeInscription) {
        // --- PROCESSUS D'INSCRIPTION ---
        const nomComplet = document.getElementById("nomInput").value.trim();
        const confirmPassword = document.getElementById("confirmPasswordInput").value;
        const roleChoisi = document.getElementById("roleSelect").value;

        if (password !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas !");
            return;
        }

        try {
            // 1. Création dans Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Attribution automatique des rôles spécifiques selon l'email
            let roleFinal = roleChoisi;
            const emailMinuscule = email.toLowerCase();

            if (emailMinuscule === "jubiledak@gmail.com") {
                roleFinal = "administrateur";
            } else if (emailMinuscule === "aglignamou@gmail.com") {
                roleFinal = "livreur";
            }

            // 3. Enregistrement direct des informations dans Firestore (collection "users")
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                nomComplet: nomComplet,
                email: email,
                role: roleFinal,
                createdAt: new Date()
            });

            alert(`Compte créé avec succès ! Rôle attribué : ${roleFinal}`);
            redirigerSelonRole(roleFinal);

        } catch (error) {
            console.error("Erreur lors de l'inscription :", error.message);
            alert("Erreur : " + error.message);
        }

    } else {
        // --- PROCESSUS DE CONNEXION ---
        try {
            // 1. Connexion via Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Récupération du rôle existant dans Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            let roleUtilisateur = "acheteur"; // Rôle par défaut

            if (userDoc.exists()) {
                roleUtilisateur = userDoc.data().role || "acheteur";
            }

            // Sécurité additionnelle : forcer admin ou livreur selon l'email
            const emailMinuscule = email.toLowerCase();
            if (emailMinuscule === "jubiledak@gmail.com") {
                roleUtilisateur = "administrateur";
            } else if (emailMinuscule === "aglignamou@gmail.com") {
                roleUtilisateur = "livreur";
            }

            alert("Connexion réussie ! Redirection...");
            redirigerSelonRole(roleUtilisateur);

        } catch (error) {
            console.error("Erreur de connexion :", error.message);
            alert("Email ou mot de passe incorrect.");
        }
    }
};

// Fonction de réinitialisation du mot de passe
window.reinitialiserMotDePasse = async function() {
    const email = document.getElementById("emailInput").value.trim();
    if (!email) {
        alert("Veuillez d'abord entrer votre adresse email, puis cliquer sur 'Mot de passe oublié ?'.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Un e-mail de réinitialisation a été envoyé à : " + email);
    } catch (error) {
        console.error("Erreur réinitialisation :", error.message);
        alert("Erreur : " + error.message);
    }
};

// Fonction de redirection selon le rôle de l'utilisateur
function redirectionSelonRole(role) {
    if (role === "administrateur") {
        window.location.href = "admin.html";
    } else if (role === "livreur") {
        window.location.href = "livreur.html";
    } else {
        window.location.href = "index.html";
    }
}
