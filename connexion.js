/**
 * DAKPRO ÉLITE - Logique d'authentification et gestion dynamique multiplateforme
 * Fichier : connexion.js
 * Compatible : Ordinateur, Tablette et Android (Responsive Design & PWA)
 */

document.addEventListener("DOMContentLoaded", () => {
    // Détection dynamique de l'appareil pour adapter l'expérience utilisateur
    detecterEtAdapterAppareil();
    
    // Écouteur de redimensionnement pour les changements d'orientation (tablette/mobile)
    window.addEventListener("resize", detecterEtAdapterAppareil);
});

/**
 * Détecte le type d'appareil (Mobile, Tablette, Ordinateur) 
 * et ajuste dynamiquement l'interface ou le comportement si nécessaire.
 */
function detecterEtAdapterAppareil() {
    const largeurFenetre = window.innerWidth;
    const conteneurAuth = document.querySelector(".auth-container");

    if (!conteneurAuth) return;

    if (largeurFenetre <= 480) {
        // Mode Android / Smartphone compact
        conteneurAuth.classList.add("appareil-mobile");
        conteneurAuth.classList.remove("appareil-tablette", "appareil-desktop");
    } else if (largeurFenetre > 480 && largeurFenetre <= 1024) {
        // Mode Tablette
        conteneurAuth.classList.add("appareil-tablette");
        conteneurAuth.classList.remove("appareil-mobile", "appareil-desktop");
    } else {
        // Mode Ordinateur (Desktop)
        conteneurAuth.classList.add("appareil-desktop");
        conteneurAuth.classList.remove("appareil-mobile", "appareil-tablette");
    }
}

/**
 * Fonction principale appelée lors de la soumission du formulaire (Connexion ou Inscription)
 */
window.gererAuthentification = function() {
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    
    // Vérification de l'état actuel (Connexion ou Inscription) basé sur le titre du formulaire
    const titreFormulaire = document.getElementById("formTitle").innerText;
    const estInscription = titreFormulaire.includes("Créer un compte");

    if (estInscription) {
        const nom = document.getElementById("nomInput").value.trim();
        const confirmPassword = document.getElementById("confirmPasswordInput").value;
        const role = document.getElementById("roleSelect").value;

        // Validation de base des champs d'inscription
        if (!nom) {
            afficherNotification("Veuillez entrer votre nom complet.", "erreur");
            return;
        }

        if (password !== confirmPassword) {
            afficherNotification("Les mots de passe ne correspondent pas.", "erreur");
            return;
        }

        if (password.length < 6) {
            afficherNotification("Le mot de passe doit contenir au moins 6 caractères.", "erreur");
            return;
        }

        traiterInscription(nom, email, password, role);
    } else {
        // Logique de connexion
        if (!email || !password) {
            afficherNotification("Veuillez remplir tous les champs obligatoires.", "erreur");
            return;
        }

        traiterConnexion(email, password);
    }
};

/**
 * Traitement de l'inscription utilisateur
 */
function traiterInscription(nom, email, password, role) {
    console.log("Tentative d'inscription pour :", email, "en tant que", role);
    afficherNotification(`Compte ${role} créé avec succès pour ${nom} !`, "succes");
}

/**
 * Traitement de la connexion utilisateur
 */
function traiterConnexion(email, password) {
    console.log("Tentative de connexion pour :", email);
    afficherNotification("Connexion réussie ! Redirection...", "succes");
}

/**
 * Gestion de la réinitialisation du mot de passe (Mot de passe oublié)
 */
window.reinitialiserMotDePasse = function() {
    const email = document.getElementById("emailInput").value.trim();

    if (!email) {
        afficherNotification("Veuillez d'abord saisir votre adresse email ci-dessus.", "erreur");
        document.getElementById("emailInput").focus();
        return;
    }

    console.log("Demande de réinitialisation pour :", email);
    afficherNotification("Un lien de réinitialisation a été envoyé à " + email, "succes");
};

/**
 * Système de notification dynamique (alerte visuelle propre)
 */
function afficherNotification(message, type) {
    // Supprimer l'ancienne notification si elle existe
    const ancienneAlerte = document.getElementById("notificationAlerte");
    if (ancienneAlerte) ancienneAlerte.remove();

    const alerte = document.createElement("div");
    alerte.id = "notificationAlerte";
    alerte.innerText = message;
    
    // Styles dynamiques pour l'alerte
    alerte.style.position = "fixed";
    alerte.style.top = "20px";
    alerte.style.left = "50%";
    alerte.style.transform = "translateX(-50%)";
    alerte.style.padding = "12px 20px";
    alerte.style.borderRadius = "8px";
    alerte.style.fontSize = "13px";
    alerte.style.fontWeight = "600";
    alerte.style.zIndex = "1000";
    alerte.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
    alerte.style.transition = "all 0.3s ease";

    if (type === "erreur") {
        alerte.style.background = "#ff4d4d";
        alerte.style.color = "#ffffff";
    } else {
        alerte.style.background = "#d4af37";
        alerte.style.color = "#000000";
    }

    document.body.appendChild(alerte);

    // Disparition automatique après 4 secondes
    setTimeout(() => {
        alerte.style.opacity = "0";
        setTimeout(() => alerte.remove(), 300);
    }, 4000);
}