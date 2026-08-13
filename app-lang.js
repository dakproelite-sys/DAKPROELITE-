// Dictionnaires de langues
const translations = {
    fr: {
        nav_cart: "Panier",
        nav_account: "Compte",
        btn_view: "Acheter / Détails",
        btn_copy_link: "🔗 Partager / Gagner",
        search_placeholder: "Rechercher un produit..."
    },
    en: {
        nav_cart: "Cart",
        nav_account: "Account",
        btn_view: "Buy / Details",
        btn_copy_link: "🔗 Share / Earn",
        search_placeholder: "Search for a product..."
    },
    es: {
        nav_cart: "Carrito",
        nav_account: "Cuenta",
        btn_view: "Comprar / Detalles",
        btn_copy_link: "🔗 Compartir / Ganar",
        search_placeholder: "Buscar un producto..."
    }
    // Ajouter les autres langues (de, it, pt, zh, ar, yo)...
};

// Fonction pour appliquer la langue sur tout le document HTML
window.appliquerLangue = function(lang) {
    localStorage.setItem('dakpro_lang', lang);
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });

    const inputs = document.querySelectorAll('[data-i18n-placeholder]');
    inputs.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Mettre à jour le sélecteur si présent
    const selector = document.getElementById('worldLangSelector');
    if (selector) selector.value = lang;
};

// Fonction globale déclenchée au changement dans le select
window.changerLangue = function(lang) {
    window.appliquerLangue(lang);
};

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem('dakpro_lang') || 'fr';
    window.appliquerLangue(savedLang);
});