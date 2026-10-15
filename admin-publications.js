import {
    getDatabase,
    ref,
    push,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

/* ============================================================
   DAKPRO ÉLITE — admin-publications.js
   MODULE DE PUBLICATION UNIFIÉ AVEC COMMISSIONS MODIFIABLES,
   RECHERCHE INSTANTANÉE, UPLOAD RAPIDE & BARRE DE PROGRESSION (0% - 100%)
============================================================ */

// Configuration Cloudinary
const CLOUDINARY_CLOUD_NAME = "iufene3y";
const CLOUDINARY_UPLOAD_PRESET = "dakproelite_preset";

// Fonction d'upload optimisée avec suivi de progression (XMLHttpRequest pour compter de 0 à 100%)
function uploadToCloudinaryWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "dakproelite");

    const xhr = new XMLHttpRequest();
    // Utilisation de l'endpoint universel 'auto' pour accepter images, vidéos et documents rapidement
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, true);

    xhr.upload.onprogress = function(event) {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        if (onProgress) onProgress(percentComplete);
      }
    };

    xhr.onload = function() {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error(data.error?.message || "Erreur lors de l'upload sur Cloudinary"));
        }
      } catch (e) {
        reject(new Error("Erreur de traitement de la réponse Cloudinary."));
      }
    };

    xhr.onerror = function() {
      reject(new Error("Erreur réseau lors du téléchargement vers Cloudinary. Vérifiez votre connexion."));
    };

    xhr.send(formData);
  });
}

const categoriesCatalogue = [
    { name: "Téléphones et tablettes", icon: "fa-mobile-screen-button", sub: ["Smartphones", "iPhone", "Samsung", "Tecno", "Infinix", "Xiaomi", "Huawei", "Téléphones classiques", "Téléphones reconditionnés", "Tablettes Android", "iPad", "Tablettes Windows", "Liseuses électroniques", "Coques et étuis", "Films de protection", "Chargeurs", "Câbles USB", "Batteries externes", "Batteries de téléphone", "Écouteurs", "Supports de téléphone", "Cartes mémoire", "Stylets", "Pièces détachées"] },
    { name: "Informatique et ordinateurs", icon: "fa-laptop", sub: ["Ordinateurs portables", "Ordinateurs de bureau", "PC tout-en-un", "Mini-PC", "PC gaming", "Serveurs", "Stations de travail", "Chromebooks", "Écrans", "Claviers", "Souris", "Imprimantes", "Scanners", "Photocopieurs", "Onduleurs", "Disques durs", "SSD", "Clés USB", "Cartes mémoire", "Cartes graphiques", "Cartes mères", "Processeurs", "Mémoire RAM", "Boîtiers PC", "Alimentations", "Refroidissement", "Routeurs Wi-Fi", "Modems", "Switches réseau", "Câbles informatiques", "Accessoires informatiques", "Pièces détachées"] },
    { name: "Télévision et électronique", icon: "fa-tv", sub: ["Téléviseurs LED", "Téléviseurs OLED", "Téléviseurs QLED", "Smart TV", "Téléviseurs 4K et 8K", "Décodeurs TV", "Antennes TV", "Projecteurs vidéo", "Écrans de projection", "Home cinéma", "Barres de son", "Haut-parleurs", "Enceintes Bluetooth", "Amplificateurs", "Radios", "Lecteurs DVD et Blu-ray", "Casques audio", "Écouteurs sans fil", "Microphones", "Tables de mixage", "Équipements de studio", "Lecteurs multimédias", "Câbles HDMI", "Télécommandes", "Karaoké"] },
    { name: "Maison et décoration", icon: "fa-house", sub: ["Meubles de salon", "Canapés", "Fauteuils", "Tables basses", "Meubles TV", "Étagères", "Bibliothèques", "Armoires", "Tables à manger", "Chaises", "Lits", "Matelas", "Oreillers", "Draps", "Couvertures", "Rideaux", "Tapis", "Décoration murale", "Tableaux", "Miroirs", "Horloges murales", "Lampes décoratives", "Plantes artificielles", "Vases", "Bougies décoratives", "Cadres photo", "Objets d'art", "Rangements", "Paniers", "Organisateurs"] },
    { name: "Cuisine et ustensiles", icon: "fa-kitchen-set", sub: ["Marmites", "Casseroles", "Poêles", "Cocottes-minute", "Friteuses", "Friteuses à air chaud", "Mixeurs", "Blenders", "Batteurs électriques", "Robots de cuisine", "Hachoirs", "Presse-agrumes", "Machines à café", "Bouilloires", "Grille-pain", "Fours", "Micro-ondes", "Cuiseurs à riz", "Plaques de cuisson", "Réchauds à gaz", "Réchauds électriques", "Couteaux de cuisine", "Planches à découper", "Assiettes", "Bols", "Verres", "Tasses", "Couverts", "Boîtes alimentaires", "Gourdes", "Thermos", "Moules à pâtisserie", "Matériel de restaurant"] },
    { name: "Électroménager", icon: "fa-blender", sub: ["Réfrigérateurs", "Congélateurs", "Réfrigérateurs combinés", "Machines à laver", "Sèche-linge", "Lave-vaisselle", "Fers à repasser", "Centrales vapeur", "Aspirateurs", "Aspirateurs robots", "Nettoyeurs vapeur", "Climatiseurs", "Ventilateurs", "Rafraîchisseurs d'air", "Chauffages électriques", "Déshumidificateurs", "Purificateurs d'air", "Machines à glaçons", "Distributeurs d'eau", "Fontaines à eau", "Chauffe-eau", "Extracteurs d'air", "Pièces détachées"] },
    { name: "Mode homme", icon: "fa-person", sub: ["T-shirts", "Chemises", "Polos", "Pantalons", "Jeans", "Shorts", "Costumes", "Vestes", "Blousons", "Manteaux", "Pulls", "Sweats", "Survêtements", "Boubous", "Vêtements traditionnels", "Sous-vêtements", "Chaussettes", "Pyjamas", "Vêtements de nuit", "Vêtements de travail", "Tenues de cérémonie", "Vêtements de plage"] },
    { name: "Mode femme", icon: "fa-person-dress", sub: ["Robes", "Jupes", "Chemisiers", "T-shirts", "Tops", "Jeans", "Pantalons", "Shorts", "Combinaisons", "Ensembles", "Vestes", "Manteaux", "Pulls", "Sweats", "Pagnes", "Tissus imprimés", "Tenues africaines", "Tenues de cérémonie", "Vêtements de grossesse", "Lingerie", "Pyjamas", "Vêtements de plage", "Vêtements de sport"] },
    { name: "Bébé et puériculture", icon: "fa-baby", sub: ["Vêtements pour bébés", "Bodies", "Pyjamas pour bébés", "Chaussures pour bébés", "Couches", "Lingettes", "Biberons", "Tétines", "Chauffe-biberons", "Stérilisateurs", "Poussettes", "Porte-bébés", "Sièges auto", "Berceaux", "Lits pour bébés", "Matelas pour bébés", "Chaises hautes", "Jouets pour bébés", "Tapis d'éveil", "Moniteurs pour bébés", "Produits de bain", "Soins pour bébés", "Sacs à langer", "Accessoires d'allaitement", "Sécurité des enfants"] },
    { name: "Chaussures", icon: "fa-shoe-prints", sub: ["Chaussures homme", "Chaussures femme", "Chaussures enfant", "Chaussures de sport", "Baskets", "Chaussures de ville", "Chaussures de cérémonie", "Chaussures de sécurité", "Chaussures de travail", "Sandales", "Claquettes", "Tongs", "Bottes", "Bottines", "Mocassins", "Escarpins", "Chaussures traditionnelles", "Chaussures de randonnée", "Chaussons"] },
    { name: "Sacs et bagages", icon: "fa-bag-shopping", sub: ["Sacs à main", "Sacs à dos", "Sacs scolaires", "Sacs professionnels", "Sacs pour ordinateurs", "Sacs de voyage", "Valises", "Sacs de sport", "Sacs de randonnée", "Sacs à langer", "Portefeuilles", "Porte-cartes", "Porte-monnaie", "Trousses", "Sacs de rangement", "Accessoires de voyage"] },
    { name: "Beauté et soins personnels", icon: "fa-spa", sub: ["Maquillage", "Fonds de teint", "Poudres", "Rouges à lèvres", "Gloss", "Mascara", "Eyeliner", "Fards à paupières", "Vernis à ongles", "Faux ongles", "Pinceaux de maquillage", "Démaquillants", "Crèmes pour le visage", "Sérums", "Masques de beauté", "Nettoyants visage", "Crèmes hydratantes", "Produits solaires", "Soins anti-âge", "Lotions corporelles", "Déodorants", "Parfums", "Eaux de toilette", "Huiles parfumées", "Produits de rasage", "Épilateurs", "Appareils de beauté", "Accessoires de manucure"] },
    { name: "Coiffure et cheveux", icon: "fa-scissors", sub: ["Shampoings", "Après-shampoings", "Masques capillaires", "Huiles capillaires", "Sérums capillaires", "Produits coiffants", "Gels", "Cires", "Colorations", "Perruques", "Perruques naturelles", "Perruques synthétiques", "Extensions capillaires", "Tissages", "Mèches", "Cheveux naturels", "Tondeuses", "Sèche-cheveux", "Lisseurs", "Boucleurs", "Brosses", "Peignes", "Accessoires de coiffure", "Équipements de salon"] },
    { name: "Santé et bien-être", icon: "fa-heart-pulse", sub: ["Thermomètres", "Tensiomètres", "Oxymètres", "Pèse-personnes", "Balances de précision", "Premiers secours", "Pansements", "Compresses", "Gants médicaux", "Masques médicaux", "Fauteuils roulants", "Cannes de marche", "Déambulateurs", "Matériel de rééducation", "Équipements de massage", "Appareils de bien-être", "Matériel médical professionnel", "Équipements de laboratoire", "Produits d'hygiène", "Équipements de protection médicale"] },
    { name: "Bijoux et montres", icon: "fa-gem", sub: ["Montres homme", "Montres femme", "Montres connectées", "Bracelets connectés", "Montres de luxe", "Bracelets", "Colliers", "Chaînes", "Bagues", "Alliances", "Boucles d'oreilles", "Pendentifs", "Bijoux fantaisie", "Bijoux en acier inoxydable", "Bijoux en argent", "Bijoux en or", "Broches", "Bijoux traditionnels", "Boîtes à bijoux", "Présentoirs à bijoux"] },
    { name: "Sports et fitness", icon: "fa-dumbbell", sub: ["Vêtements de sport", "Chaussures de sport", "Haltères", "Barres de musculation", "Bancs de musculation", "Tapis de yoga", "Tapis de gymnastique", "Vélos d'appartement", "Tapis de course", "Cordes à sauter", "Élastiques de résistance", "Football", "Basketball", "Volleyball", "Tennis", "Badminton", "Tennis de table", "Natation", "Boxe", "Randonnée", "Sacs de sport", "Accessoires de fitness", "Camping"] },
    { name: "Jouets et jeux", icon: "fa-puzzle-piece", sub: ["Jouets pour bébés", "Poupées", "Maisons de poupées", "Figurines", "Voitures miniatures", "Jeux de construction", "Blocs de construction", "Jeux éducatifs", "Jeux de société", "Puzzles", "Jeux de cartes", "Jeux scientifiques", "Jouets électroniques", "Jouets télécommandés", "Drones-jouets", "Robots éducatifs", "Peluches", "Jouets d'extérieur", "Toboggans", "Tricycles", "Vélos pour enfants", "Jeux de plage", "Loisirs créatifs"] },
    { name: "Jeux vidéo et consoles", icon: "fa-gamepad", sub: ["PlayStation", "Xbox", "Nintendo", "Consoles portables", "Consoles rétro", "Jeux vidéo", "Manettes", "Casques gaming", "Claviers gaming", "Souris gaming", "Écrans gaming", "Fauteuils gaming", "Volants de simulation", "Accessoires de console", "Cartes mémoire", "Cartes cadeaux numériques", "Réalité virtuelle"] },
    { name: "Photographie et vidéo", icon: "fa-camera", sub: ["Appareils photo numériques", "Appareils photo professionnels", "Appareils photo instantanés", "Caméras vidéo", "Caméras de surveillance", "Caméras sportives", "Drones professionnels", "Objectifs photo", "Trépieds", "Stabilisateurs", "Éclairages de studio", "Ring lights", "Flashs", "Micros pour caméra", "Fonds de studio", "Accessoires photo", "Jumelles", "Télescopes", "Production vidéo"] },
    { name: "Électricité et énergie solaire", icon: "fa-solar-panel", sub: ["Panneaux solaires", "Kits solaires", "Batteries solaires", "Onduleurs solaires", "Régulateurs de charge", "Centrales électriques portables", "Générateurs électriques", "Groupes électrogènes", "Batteries rechargeables", "Lampes solaires", "Lampadaires solaires", "Éclairage LED", "Ampoules", "Projecteurs LED", "Multiprises", "Rallonges électriques", "Câbles électriques", "Disjoncteurs", "Interrupteurs", "Prises électriques", "Matériel électrique", "Accessoires solaires"] },
    { name: "Automobile et véhicules", icon: "fa-car", sub: ["Voitures neuves", "Voitures d'occasion", "Toyota", "Lexus", "Range Rover", "Mercedes-Benz", "BMW", "Honda", "Nissan", "Hyundai", "Kia", "Volkswagen", "SUV", "Berlines", "Pick-up", "Véhicules utilitaires", "Minibus", "Camions", "Bus", "Véhicules électriques", "Voitures hybrides", "Motos", "Scooters", "Tricycles motorisés", "Quads", "Vélos", "Vélos électriques", "Trottinettes électriques", "Pièces automobiles", "Pneus", "Jantes", "Batteries automobiles", "Huiles moteur", "Filtres", "Freins", "Amortisseurs", "Accessoires auto", "Autoradios", "GPS automobiles", "Caméras de recul", "Housses de siège", "Tapis de voiture", "Nettoyage automobile", "Équipements de garage", "Casques de moto", "Pièces de moto"] },
    { name: "Bricolage et construction", icon: "fa-screwdriver-wrench", sub: ["Perceuses", "Visseuses", "Meuleuses", "Scies électriques", "Scies manuelles", "Marteaux", "Tournevis", "Clés", "Pinces", "Outils de mesure", "Postes à souder", "Compresseurs", "Échelles", "Échafaudages", "Équipements de sécurité", "Matériel de plomberie", "Tuyaux", "Robinetterie", "Matériaux de construction", "Peintures", "Vernis", "Colles", "Serrures", "Poignées de porte", "Quincaillerie", "Équipements de chantier", "Matériel professionnel"] },
    { name: "Jardin et agriculture", icon: "fa-seedling", sub: ["Outils de jardinage", "Arrosoirs", "Tuyaux d'arrosage", "Pompes à eau", "Systèmes d'irrigation", "Tondeuses à gazon", "Débroussailleuses", "Tronçonneuses", "Sécateurs", "Semences", "Plants", "Pots de fleurs", "Terreaux", "Engrais", "Tracteurs", "Motoculteurs", "Motopompes", "Pulvérisateurs agricoles", "Matériel d'élevage", "Mangeoires", "Abreuvoirs", "Incubateurs à œufs", "Matériel d'aquaculture", "Serres agricoles", "Filets agricoles", "Équipements de récolte"] },
    { name: "Supermarché et alimentation", icon: "fa-basket-shopping", sub: ["Riz", "Pâtes alimentaires", "Farine", "Maïs", "Céréales", "Huiles alimentaires", "Sucre", "Sel", "Conserves", "Lait", "Produits laitiers", "Café", "Thé", "Chocolat", "Biscuits", "Bonbons", "Jus de fruits", "Eau minérale", "Boissons", "Épices", "Condiments", "Sauces", "Fruits", "Légumes", "Produits surgelés", "Produits de boulangerie", "Produits de pâtisserie", "Produits alimentaires locaux", "Produits biologiques", "Produits sans gluten", "Alimentation spécialisée"] },
    { name: "Entretien et hygiène", icon: "fa-broom", sub: ["Détergents", "Savons ménagers", "Lessives", "Adoucissants", "Liquides vaisselle", "Nettoyants pour sols", "Désinfectants", "Désodorisants", "Éponges", "Brosses", "Balais", "Serpillières", "Seaux", "Poubelles", "Sacs-poubelle", "Gants de ménage", "Aspirateurs", "Matériel de nettoyage professionnel", "Accessoires de rangement"] },
    { name: "Animaux et accessoires", icon: "fa-paw", sub: ["Aliments pour chiens", "Aliments pour chats", "Aliments pour oiseaux", "Aliments pour poissons", "Colliers", "Laisses", "Harnais", "Paniers pour animaux", "Niches", "Cages", "Aquariums", "Filtres d'aquarium", "Jouets pour animaux", "Gamelles", "Fontaines à eau", "Bacs à litière", "Litières", "Brosses", "Toilettage animal", "Accessoires d'élevage"] },
    { name: "Livres et fournitures scolaires", icon: "fa-book-open", sub: ["Livres scolaires", "Livres universitaires", "Romans", "Livres pour enfants", "Dictionnaires", "Encyclopédies", "Livres professionnels", "Livres numériques", "Manuels techniques", "Cahiers", "Stylos", "Crayons", "Marqueurs", "Gommes", "Règles", "Trousses scolaires", "Sacs scolaires", "Calculatrices", "Tableaux", "Matériel pédagogique", "Fournitures pour enseignants", "Matériel de dessin", "Matériel d'examen"] },
    { name: "Bureau et fournitures professionnelles", icon: "fa-briefcase", sub: ["Bureaux", "Fauteuils de bureau", "Chaises professionnelles", "Armoires de classement", "Classeurs", "Papier d'impression", "Cartouches d'encre", "Toners", "Imprimantes professionnelles", "Plastifieuses", "Destructeurs de documents", "Vidéoprojecteurs", "Tableaux blancs", "Fournitures de bureau", "Visioconférence", "Téléphones professionnels", "Matériel de réception", "Mobilier de réunion", "Équipements de caisse", "Lecteurs de codes-barres"] },
    { name: "Industrie et équipements professionnels", icon: "fa-industry", sub: ["Machines industrielles", "Machines textiles", "Machines de couture", "Machines de fabrication", "Machines d'emballage", "Machines alimentaires", "Équipements de restaurant", "Équipements d'hôtel", "Matériel de laboratoire", "Instruments de mesure", "Pompes industrielles", "Moteurs électriques", "Roulements mécaniques", "Compresseurs industriels", "Matériel de soudage", "Manutention", "Chariots professionnels", "Rayonnages d'entrepôt", "Sécurité industrielle", "Vêtements professionnels", "Pièces de machines", "Matériel de maintenance"] },
    { name: "Instruments de musique", icon: "fa-music", sub: ["Pianos", "Claviers électroniques", "Guitares", "Basses", "Violons", "Batteries", "Percussions", "Djembés", "Instruments africains traditionnels", "Trompettes", "Saxophones", "Flûtes", "Accordéons", "Microphones", "Amplificateurs", "Enceintes de sonorisation", "Tables de mixage", "Accessoires musicaux", "Équipements DJ", "Studio d'enregistrement"] },
    { name: "Arts et loisirs créatifs", icon: "fa-palette", sub: ["Peintures artistiques", "Pinceaux", "Toiles", "Crayons de dessin", "Matériel de sculpture", "Papiers créatifs", "Perles", "Fils et laines", "Matériel de couture", "Tissus", "Machines à coudre", "Broderie", "Tricot", "Fabrication de bijoux", "Décoration artisanale", "Bricolage créatif", "Kits de loisirs créatifs", "Calligraphie"] },
    { name: "Voyage et bagagerie", icon: "fa-suitcase-rolling", sub: ["Valises", "Sacs de voyage", "Sacs à dos", "Trousses de toilette", "Oreillers de voyage", "Accessoires pour passeports", "Étiquettes à bagages", "Organisateurs de valise", "Adaptateurs de voyage", "Cadenas de bagages", "Accessoires de camping", "Tentes", "Sacs de couchage", "Matériel de randonnée", "Gourdes de randonnée", "Accessoires de plage"] },
    { name: "Accessoires de mode", icon: "fa-glasses", sub: ["Lunettes de soleil", "Lunettes de vue", "Ceintures", "Cravates", "Nœuds papillon", "Foulards", "Écharpes", "Chapeaux", "Casquettes", "Bonnets", "Gants", "Parapluies", "Boutons de manchette", "Accessoires de cheveux", "Bijoux de mode", "Accessoires traditionnels", "Maroquinerie"] },
    { name: "Mariage et fêtes", icon: "fa-champagne-glasses", sub: ["Robes de mariée", "Costumes de mariage", "Tenues de cérémonie", "Tenues de demoiselles d'honneur", "Décoration de mariage", "Fleurs artificielles", "Accessoires de mariage", "Alliances", "Décoration d'anniversaire", "Ballons", "Guirlandes", "Bougies de fête", "Vaisselle de fête", "Cadeaux personnalisés", "Emballages cadeaux", "Décoration de Noël", "Décoration festive", "Costumes de carnaval", "Accessoires de déguisement"] },
    { name: "Plein air et loisirs", icon: "fa-campground", sub: ["Tentes", "Chaises de camping", "Tables pliantes", "Sacs de couchage", "Lampes de camping", "Glacières", "Matériel de pêche", "Cannes à pêche", "Accessoires de randonnée", "Jumelles", "Équipements de plage", "Parasols de plage", "Piscines", "Accessoires de piscine", "Barbecues", "Mobilier de jardin", "Hamacs", "Loisirs en plein air"] },
    { name: "Sécurité et domotique", icon: "fa-shield-halved", sub: ["Caméras de surveillance", "Sonnettes vidéo", "Alarmes", "Détecteurs de fumée", "Détecteurs de mouvement", "Serrures connectées", "Interphones", "Contrôle d'accès", "Détecteurs de fuite d'eau", "Capteurs intelligents", "Ampoules connectées", "Prises connectées", "Thermostats connectés", "Routeurs domestiques", "Systèmes domotiques", "Accessoires de sécurité"] },
    { name: "Eau et plomberie", icon: "fa-faucet-drip", sub: ["Filtres à eau", "Purificateurs d'eau", "Distributeurs d'eau", "Pompes à eau", "Réservoirs d'eau", "Citernes", "Tuyaux", "Robinets", "Douches", "Lavabos", "Éviers", "Toilettes", "Accessoires de salle de bain", "Chauffe-eau", "Matériel d'irrigation", "Traitement de l'eau"] },
    { name: "Salle de bain et sanitaires", icon: "fa-bath", sub: ["Meubles de salle de bain", "Miroirs", "Armoires de toilette", "Douches", "Cabines de douche", "Baignoires", "Robinets", "Porte-serviettes", "Distributeurs de savon", "Tapis de bain", "Rideaux de douche", "Serviettes", "Peignoirs", "Paniers à linge", "Accessoires sanitaires"] },
    { name: "Textiles et tissus", icon: "fa-shirt", sub: ["Pagnes", "Tissus africains", "Wax", "Tissus en coton", "Tissus en polyester", "Tissus de cérémonie", "Tissus d'ameublement", "Rideaux", "Draps", "Couvertures", "Serviettes", "Nappes", "Housses de canapé", "Housses de coussin", "Tissus de confection", "Fils à coudre", "Fermetures éclair", "Boutons", "Accessoires de couture"] },
    { name: "Mobilier professionnel", icon: "fa-chair", sub: ["Mobilier de magasin", "Comptoirs de vente", "Présentoirs", "Vitrines", "Rayonnages", "Gondoles commerciales", "Mannequins de vitrine", "Mobilier de restaurant", "Mobilier d'hôtel", "Mobilier scolaire", "Mobilier médical", "Mobilier de bureau", "Tables de conférence", "Chaises de réception", "Équipements d'accueil"] },
    { name: "Commerce et emballage", icon: "fa-boxes-stacked", sub: ["Caisses enregistreuses", "Terminaux de paiement", "Lecteurs de codes-barres", "Imprimantes de reçus", "Étiqueteuses", "Balances commerciales", "Sacs d'emballage", "Cartons", "Boîtes d'expédition", "Rubans adhésifs", "Films d'emballage", "Pochettes d'expédition", "Emballages personnalisés", "Sacs publicitaires", "Étiquettes de marque", "Matériel de stockage", "Accessoires pour vendeurs"] },
    { name: "Cadeaux et produits personnalisés", icon: "fa-gift", sub: ["Cadeaux d'anniversaire", "Cadeaux de mariage", "Cadeaux d'entreprise", "Cadeaux pour enfants", "Cadeaux romantiques", "Articles personnalisés", "Tasses personnalisées", "T-shirts personnalisés", "Porte-clés", "Stylos publicitaires", "Articles promotionnels", "Objets gravés", "Cadres personnalisés", "Décoration personnalisée"] },
    { name: "Logiciels et produits numériques", icon: "fa-laptop-code", sub: ["Logiciels bureautiques", "Logiciels de gestion", "Logiciels de comptabilité", "Logiciels de conception", "Logiciels éducatifs", "Applications mobiles", "Thèmes et modèles numériques", "Livres électroniques", "Formations en ligne", "Cours vidéo", "Documents numériques", "Modèles de CV", "Modèles de factures", "Ressources graphiques", "Services numériques", "Cartes cadeaux numériques"] },
    { name: "Cours et formations", icon: "fa-graduation-cap", sub: ["Informatique", "Programmation", "Développement web", "Marketing digital", "Commerce électronique", "Entrepreneuriat", "Comptabilité", "Gestion d'entreprise", "Langues", "Français", "Anglais", "Mathématiques", "Sciences", "Agriculture", "Couture", "Coiffure", "Esthétique", "Cuisine", "Musique", "Design graphique", "Préparation aux examens", "Formation professionnelle"] },
    { name: "Immobilier et terrains", icon: "fa-building", sub: ["Maisons à vendre", "Maisons à louer", "Appartements à vendre", "Appartements à louer", "Terrains à vendre", "Terrains agricoles", "Bureaux à louer", "Boutiques à louer", "Entrepôts", "Locaux commerciaux", "Villas", "Studios", "Chambres à louer", "Résidences meublées", "Propriétés industrielles"] },
    { name: "Services professionnels", icon: "fa-screwdriver-wrench", sub: ["Réparation de téléphones", "Réparation d'ordinateurs", "Réparation électronique", "Installation solaire", "Installation électrique", "Plomberie", "Menuiserie", "Soudure", "Couture", "Coiffure", "Esthétique", "Photographie", "Vidéographie", "Graphisme", "Développement web", "Création d'applications", "Marketing digital", "Comptabilité", "Traduction", "Livraison", "Déménagement", "Nettoyage professionnel", "Maintenance industrielle"] },
    { name: "Livres et papeterie", icon: "fa-book", sub: ["Romans", "Livres scolaires", "Cahiers", "Stylos", "Agendas", "Papier d'impression"] },
    { name: "Livres et papeterie", icon: "fa-book", sub: ["Romans", "Livres scolaires", "Cahiers", "Stylos", "Agendas", "Papier d'impression"] },
    { name: "Livraison et mobilité", icon: "fa-motorcycle", sub: ["Vélos", "Vélos électriques", "Scooters", "Motos", "Trottinettes électriques", "Casques et accessoires", "Pièces détachées", "Sacs de livraison", "Équipements de coursier", "Accessoires de transport", "Aides à la mobilité"] },
    { name: "Collections et objets rares", icon: "fa-trophy", sub: ["Pièces de collection", "Timbres", "Monnaies anciennes", "Figurines de collection", "Jouets anciens", "Objets historiques", "Cartes à collectionner", "Objets décoratifs rares", "Collections sportives", "Souvenirs", "Objets artisanaux traditionnels"] }
];

export async function init() {
    const container = document.getElementById("module-container");
    if (!container) {
        console.warn("DAKPRO ÉLITE : #module-container introuvable.");
        return;
    }

    const db = getDatabase();
    const currentUser = window.currentUser || null;
    const currentUserIsAdmin = window.currentUserIsAdmin === true;

    container.innerHTML = `
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
        <style>
            * { box-sizing: border-box; }
            .pub-container { width: 100%; color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 15px; border-radius: 12px; }
            .pub-title { color: #ffcc00; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; letter-spacing: .5px; border-left: 4px solid #ffcc00; padding-left: 10px; }
            .pub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
            .pub-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, .5); }
            .pub-card-title { font-size: 14px; font-weight: 900; color: #ffcc00; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #282836; padding-bottom: 10px; }
            
            .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; }
            .form-group label { font-size: 11px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
            .form-group label i { color: #ffcc00; }
            .form-group input, .form-group select, .form-group textarea { width: 100%; background: #0d0d11; border: 1px solid #282836; color: #ffcc00; padding: 10px 12px; border-radius: 6px; font-size: 13px; outline: none; }
            .form-group textarea { resize: vertical; min-height: 100px; }
            .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #ffcc00; box-shadow: 0 0 8px rgba(255, 204, 0, .25); }

            .price-grid, .pub-date-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            .pub-date-item { background: #0d0d11; border: 1px solid #282836; border-radius: 8px; padding: 10px; }
            .pub-date-label { display: block; color: #888; font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
            .pub-date-value { color: #ffcc00; font-size: 12px; font-weight: 800; }

            .commission-box { background: #0d0d11; border: 1px solid #ffcc00; border-radius: 8px; padding: 12px; margin-top: 10px; }
            .commission-title { color: #ffcc00; font-size: 12px; font-weight: 900; margin-bottom: 10px; }
            .commission-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
            .commission-input input { width: 100%; background: #050505; border: 1px solid #333; color: #ffcc00; padding: 8px; border-radius: 6px; text-align: center; font-weight: 800; }
            
            .btn-pub-action { background: linear-gradient(135deg, #ffcc00, #e6b800); color: #000; font-weight: 900; border: none; padding: 14px 25px; border-radius: 8px; cursor: pointer; transition: .2s; text-transform: uppercase; font-size: 13px; width: 100%; margin-top: 15px; }
            .btn-pub-action:hover { background: linear-gradient(135deg, #ffe57f, #ffcc00); box-shadow: 0 4px 15px rgba(255, 204, 0, .3); }
            
            .preview-box { min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0d0d11; border: 1px dashed #282836; border-radius: 8px; padding: 15px; gap: 10px; }
            .preview-canvas { width: 100%; max-width: 300px; height: 180px; object-fit: cover; border-radius: 7px; background: #080b10; border: 1px solid #ffcc00; display: none; }
            .preview-video { width: 100%; max-width: 300px; height: 180px; object-fit: cover; border-radius: 7px; background: #000; border: 1px solid #ffcc00; display: none; }
            
            .status-box { margin-bottom: 15px; padding: 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: #050505; border: 1px solid #282836; }
            .status-ok { color: #22c55e; border-color: #22c55e; }
            .status-error { color: #ef4444; border-color: #ef4444; }
        </style>

        <div class="pub-container">
            <div class="pub-title">📦 Publication Unifiée (Commissions, Recherche & Cloudinary)</div>
            <div id="adminPublicationStatus" class="status-box">Vérification de la session...</div>

            <div class="pub-grid">
                <!-- FORMULAIRE -->
                <div class="pub-card">
                    <div class="pub-card-title">📝 Détails de la Publication</div>

                    <div class="pub-date-box">
                        <div class="pub-date-item">
                            <span class="pub-date-label">📅 Date</span>
                            <span id="adminPublicationDate" class="pub-date-value">--</span>
                        </div>
                        <div class="pub-date-item">
                            <span class="pub-date-label">🕐 Heure</span>
                            <span id="adminPublicationTime" class="pub-date-value">--</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-user"></i> Nom du Vendeur / Auteur</label>
                        <input type="text" id="adminVendeurNom" placeholder="Nom ou Pseudonyme du vendeur">
                    </div>

                    <div class="form-group">
                        <label>Nom du Produit / Formation</label>
                        <input type="text" id="adminProductName" placeholder="Ex : DAKJUBILE TONIC VITAL">
                    </div>

                    <!-- RECHERCHE & CATÉGORIE PRINCIPALE -->
                    <div class="form-group">
                        <label><i class="fa-solid fa-magnifying-glass"></i> Rechercher / Choisir la Catégorie</label>
                        <input type="text" id="categorySearchInput" placeholder="Tapez pour filtrer les catégories..." style="margin-bottom:6px;">
                        <select id="adminProductCategory" size="5" style="height: 120px;"></select>
                    </div>

                    <!-- RECHERCHE & SOUS-CATÉGORIE DYNAMIQUE -->
                    <div class="form-group">
                        <label><i class="fa-solid fa-tags"></i> Rechercher / Choisir la Sous-catégorie</label>
                        <input type="text" id="subCategorySearchInput" placeholder="Tapez pour filtrer les sous-catégories..." style="margin-bottom:6px;" disabled>
                        <select id="adminProductSubCategory" size="4" style="height: 100px;">
                            <option value="">-- Choisissez d'abord une catégorie --</option>
                        </select>
                    </div>

                    <div class="price-grid">
                        <div class="form-group">
                            <label>Prix Normal</label>
                            <input type="number" id="adminProductPrice" placeholder="10000" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Prix Promo (Optionnel)</label>
                            <input type="number" id="adminProductPromoPrice" placeholder="7500" min="0" step="0.01">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Devise</label>
                        <select id="adminProductCurrency">
                            <option value="FCFA">FCFA — Franc CFA</option>
                            <option value="EUR">EUR — Euro (€)</option>
                            <option value="USD">USD — Dollar ($)</option>
                        </select>
                    </div>

                    <!-- SÉLECTEUR UNIVERSEL DE MÉDIAS -->
                    <div class="form-group">
                        <label><i class="fa-solid fa-folder-open"></i> Choisir un Fichier depuis votre Galerie / Appareil (Image, Vidéo ou Document)</label>
                        <input type="file" id="adminUniversalFile" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt">
                        <small id="fileInfoLabel" style="color: #ffcc00; font-size: 10px; margin-top: 4px;"></small>
                    </div>

                    <!-- CHAMP LIEN DU CATALOGUE EXTERNE -->
                    <div class="form-group">
                        <label><i class="fa-solid fa-link"></i> Lien du Catalogue Externe (Optionnel)</label>
                        <input type="url" id="adminCatalogLink" placeholder="Collez ici le lien du catalogue (ex: Google Drive...)">
                    </div>

                    <div class="form-group">
                        <label>Description Complète</label>
                        <textarea id="adminProductDescription" placeholder="Détails, avantages, informations..."></textarea>
                    </div>

                    <!-- COMMISSIONS MODIFIABLES -->
                    <div class="commission-box">
                        <div class="commission-title">💰 Répartition des Commissions (Total : 100%)</div>
                        <div class="commission-grid">
                            <div class="commission-input">
                                <label>Vendeur (%)</label>
                                <input type="number" id="adminCommissionProduit" value="80" min="0" max="100" style="color:#22c55e;">
                            </div>
                            <div class="commission-input">
                                <label>Affiliation (%)</label>
                                <input type="number" id="adminCommissionAffiliation" value="5" min="0" max="100" style="color:#ffcc00;">
                            </div>
                            <div class="commission-input">
                                <label>Plateforme (%)</label>
                                <input type="number" id="adminCommissionPlateforme" value="15" min="0" max="100" style="color:#3b82f6;">
                            </div>
                        </div>
                        <div id="adminCommissionTotal" style="text-align:center; font-size:12px; font-weight:900; margin-top:10px; color:#22c55e;">Validation : 100 %</div>
                    </div>

                    <button type="button" id="adminAddProduct" class="btn-pub-action">🚀 Publier sur la Plateforme</button>
                </div>

                <!-- APERÇU DYNAMIQUE -->
                <div class="pub-card">
                    <div class="pub-card-title">👁️ Aperçu Dynamique Interactif</div>
                    <div id="adminPreviewBox" class="preview-box">
                        <canvas id="imageCanvas" class="preview-canvas"></canvas>
                        <video id="videoPreview" class="preview-video" controls playsinline></video>
                        <div id="documentPreview" style="display:none; text-align:center;">
                            <i class="fa-solid fa-file-lines" style="font-size:40px; color:#ffcc00; margin-bottom:8px;"></i><br>
                            <a id="documentLinkBtn" href="#" target="_blank" style="color:#ffcc00; font-weight:bold; text-decoration:underline;">📄 Ouvrir / Télécharger le document</a>
                        </div>
                        <span id="previewText" style="color:#666; font-size:12px; text-align:center;">Sélectionnez un média pour afficher l'aperçu...</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Gestion du calcul et de la validation des commissions en temps réel
    const inputCommProd = document.getElementById("adminCommissionProduit");
    const inputCommAff = document.getElementById("adminCommissionAffiliation");
    const inputCommPlat = document.getElementById("adminCommissionPlateforme");
    const commTotalLabel = document.getElementById("adminCommissionTotal");

    function validateCommissions() {
        const v = Number(inputCommProd.value) || 0;
        const a = Number(inputCommAff.value) || 0;
        const p = Number(inputCommPlat.value) || 0;
        const total = v + a + p;

        if (total === 100) {
            commTotalLabel.style.color = "#22c55e";
            commTotalLabel.textContent = `Validation : 100 % (Parfait)`;
        } else {
            commTotalLabel.style.color = "#ef4444";
            commTotalLabel.textContent = `Attention : Le total est de ${total}% (Doit être égal à 100%)`;
        }
    }

    inputCommProd.addEventListener("input", validateCommissions);
    inputCommAff.addEventListener("input", validateCommissions);
    inputCommPlat.addEventListener("input", validateCommissions);

    const vendeurInput = document.getElementById("adminVendeurNom");
    if (vendeurInput && currentUser) {
        vendeurInput.value = currentUser.displayName || currentUser.email || "Admin DAKPRO";
    }

    const catSelect = document.getElementById("adminProductCategory");
    const subCatSelect = document.getElementById("adminProductSubCategory");
    const categorySearchInput = document.getElementById("categorySearchInput");
    const subCategorySearchInput = document.getElementById("subCategorySearchInput");

    let currentSubCategoriesList = [];

    function renderCategories(filter = "") {
        catSelect.innerHTML = '<option value="">-- Choisissez une catégorie --</option>';
        const query = filter.toLowerCase();

        categoriesCatalogue.forEach(cat => {
            if (cat.name.toLowerCase().includes(query)) {
                const opt = document.createElement("option");
                opt.value = cat.name;
                opt.textContent = `📁 ${cat.name}`;
                catSelect.appendChild(opt);
            }
        });
    }

    renderCategories();

    categorySearchInput.addEventListener("input", (e) => {
        renderCategories(e.target.value);
        subCatSelect.innerHTML = '<option value="">-- Choisissez d\'abord une catégorie --</option>';
        subCategorySearchInput.value = "";
        subCategorySearchInput.disabled = true;
        currentSubCategoriesList = [];
    });

    function renderSubCategories(filter = "") {
        subCatSelect.innerHTML = '<option value="">-- Sélectionnez une sous-catégorie --</option>';
        const query = filter.toLowerCase();

        currentSubCategoriesList.forEach(sub => {
            if (sub.toLowerCase().includes(query)) {
                const opt = document.createElement("option");
                opt.value = sub;
                opt.textContent = `🏷️ ${sub}`;
                subCatSelect.appendChild(opt);
            }
        });
    }

    catSelect.addEventListener("change", () => {
        const selectedCatName = catSelect.value;
        subCategorySearchInput.value = "";
        
        const found = categoriesCatalogue.find(c => c.name === selectedCatName);
        if (found && found.sub) {
            currentSubCategoriesList = found.sub;
            subCategorySearchInput.disabled = false;
            renderSubCategories();
        } else {
            currentSubCategoriesList = [];
            subCatSelect.innerHTML = '<option value="">-- Choisissez d\'abord une catégorie --</option>';
            subCategorySearchInput.disabled = true;
        }
    });

    subCategorySearchInput.addEventListener("input", (e) => {
        renderSubCategories(e.target.value);
    });

    // Sélecteur universel et aperçu interactif
    const universalFileInput = document.getElementById("adminUniversalFile");
    const fileInfoLabel = document.getElementById("fileInfoLabel");
    const canvas = document.getElementById("imageCanvas");
    const videoPreview = document.getElementById("videoPreview");
    const documentPreview = document.getElementById("documentPreview");
    const documentLinkBtn = document.getElementById("documentLinkBtn");
    const previewText = document.getElementById("previewText");

    let selectedFileObject = null;
    let uploadedImageUrl = "";
    let uploadedVideoUrl = "";
    let uploadedDocumentUrl = "";

    universalFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        selectedFileObject = file;
        const fileType = file.type;

        uploadedImageUrl = "";
        uploadedVideoUrl = "";
        uploadedDocumentUrl = "";

        canvas.style.display = "none";
        videoPreview.style.display = "none";
        documentPreview.style.display = "none";
        previewText.style.display = "block";

        const tempLocalUrl = URL.createObjectURL(file);

        if (fileType.startsWith("image/")) {
            fileInfoLabel.textContent = `🖼️ Image sélectionnée : ${file.name}`;
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const ctx = canvas.getContext("2d");
                    canvas.width = 600;
                    canvas.height = 400;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "#080b10";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    let hRatio = canvas.width / img.width;
                    let vRatio = canvas.height / img.height;
                    let ratio = Math.max(hRatio, vRatio);
                    let centerShiftX = (canvas.width - img.width * ratio) / 2;
                    let centerShiftY = (canvas.height - img.height * ratio) / 2;
                    
                    ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
                    canvas.style.display = "block";
                    previewText.style.display = "none";
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);

        } else if (fileType.startsWith("video/")) {
            fileInfoLabel.textContent = `🎥 Vidéo sélectionnée : ${file.name}`;
            videoPreview.src = tempLocalUrl;
            videoPreview.style.display = "block";
            previewText.style.display = "none";

        } else {
            fileInfoLabel.textContent = `📄 Document sélectionné : ${file.name}`;
            documentLinkBtn.href = tempLocalUrl;
            documentPreview.style.display = "block";
            previewText.style.display = "none";
        }
    });

    const getValue = (id) => document.getElementById(id)?.value?.trim() || "";
    const getNumber = (id, def = 0) => {
        const val = Number(getValue(id));
        return Number.isFinite(val) ? val : def;
    };

    function updateClock() {
        const now = new Date();
        const dateEl = document.getElementById("adminPublicationDate");
        const timeEl = document.getElementById("adminPublicationTime");
        if (dateEl) dateEl.textContent = new Intl.DateTimeFormat("fr-FR").format(now);
        if (timeEl) timeEl.textContent = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
    }
    setInterval(updateClock, 1000);
    updateClock();

    const statusBox = document.getElementById("adminPublicationStatus");
    if (statusBox) {
        if (currentUserIsAdmin && currentUser?.uid) {
            statusBox.className = "status-box status-ok";
            statusBox.textContent = `✅ Administrateur connecté & Cloudinary lié (${CLOUDINARY_CLOUD_NAME})`;
        } else {
            statusBox.className = "status-box status-error";
            statusBox.textContent = "⛔ Session administrateur non détectée.";
        }
    }

    const publishBtn = document.getElementById("adminAddProduct");
    if (publishBtn) {
        publishBtn.addEventListener("click", async () => {
            const nom = getValue("adminProductName");
            const vendeurNom = getValue("adminVendeurNom") || "Admin / DAKPRO";
            const categorie = getValue("adminProductCategory");
            const sousCategorie = getValue("adminProductSubCategory");
            const prix = getNumber("adminProductPrice", -1);
            
            const commVendeur = getNumber("adminCommissionProduit", 80);
            const commAffiliation = getNumber("adminCommissionAffiliation", 5);
            const commPlateforme = getNumber("adminCommissionPlateforme", 15);

            if (!nom) return alert("⚠️ Veuillez entrer le nom du produit.");
            if (!categorie) return alert("⚠️ Veuillez sélectionner une catégorie principale.");
            if (!sousCategorie) return alert("⚠️ Veuillez sélectionner une sous-catégorie.");
            if (prix < 0) return alert("⚠️ Veuillez indiquer un prix valide.");
            if ((commVendeur + commAffiliation + commPlateforme) !== 100) {
                return alert("⚠️ Le total des commissions doit être exactement de 100%.");
            }

            publishBtn.disabled = true;

            try {
                if (selectedFileObject) {
                    publishBtn.textContent = "⏳ Téléchargement : 0%";
                    
                    const finalFileUrl = await uploadToCloudinaryWithProgress(selectedFileObject, (percent) => {
                        publishBtn.textContent = `⏳ Téléchargement en cours : ${percent}%`;
                    });

                    const fileType = selectedFileObject.type;
                    if (fileType.startsWith("image/")) {
                        uploadedImageUrl = finalFileUrl;
                    } else if (fileType.startsWith("video/")) {
                        uploadedVideoUrl = finalFileUrl;
                    } else {
                        uploadedDocumentUrl = finalFileUrl;
                    }
                }

                publishBtn.textContent = "⏳ Enregistrement dans Realtime Database...";

                const newRef = push(ref(db, "publications"));
                const prodId = newRef.key;
                const vendeurUid = currentUser?.uid || "admin_dakpro_id";
                const lienAffiliationDirect = `${window.location.origin}/index.html?produit=${prodId}&ref=${vendeurUid}`;

                const payload = {
                    id: prodId,
                    nom: nom,
                    titre: nom,
                    vendeurNom: vendeurNom,
                    vendeurId: vendeurUid,
                    categorie: categorie,
                    sousCategorie: sousCategorie,
                    prix: prix,
                    prixPromo: getValue("adminProductPromoPrice") ? getNumber("adminProductPromoPrice") : null,
                    devise: getValue("adminProductCurrency") || "FCFA",
                    image: uploadedImageUrl || "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=700&q=75",
                    video: uploadedVideoUrl || "",
                    document: uploadedDocumentUrl || "",
                    catalogLink: getValue("adminCatalogLink"),
                    cloudinary_cloud_name: CLOUDINARY_CLOUD_NAME,
                    commissions: {
                        vendeur: commVendeur,
                        affiliation: commAffiliation,
                        plateforme: commPlateforme
                    },
                    lienAffiliation: lienAffiliationDirect,
                    description: getValue("adminProductDescription"),
                    statut: "actif",
                    actif: true,
                    stock: 999,
                    createdBy: vendeurUid,
                    createdAt: serverTimestamp(),
                    datePublication: new Date().toLocaleDateString("fr-FR"),
                    heurePublication: new Date().toLocaleTimeString("fr-FR")
                };

                await set(ref(db, `publications/${prodId}`), payload);
                await set(ref(db, `produits/${prodId}`), payload);
                await set(ref(db, `vendeur_publications/${prodId}`), payload);
                await set(ref(db, `boosts/${prodId}`), { ...payload, statut_boost: "actif" });

                alert("✅ PUBLICATION, MÉDIA CLOUDINARY ET COMMISSIONS ENREGISTRÉS AVEC SUCCÈS !");

                ["adminProductName", "adminProductPrice", "adminProductPromoPrice", "adminProductDescription", "adminCatalogLink", "categorySearchInput", "subCategorySearchInput"].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = "";
                });
                renderCategories();
                currentSubCategoriesList = [];
                subCatSelect.innerHTML = '<option value="">-- Choisissez d\'abord une catégorie --</option>';
                subCategorySearchInput.disabled = true;
                universalFileInput.value = "";
                fileInfoLabel.textContent = "";
                canvas.style.display = "none";
                videoPreview.style.display = "none";
                documentPreview.style.display = "none";
                previewText.style.display = "block";
                previewText.textContent = "Sélectionnez un média pour afficher l'aperçu...";
                selectedFileObject = null;
                uploadedImageUrl = "";
                uploadedVideoUrl = "";
                uploadedDocumentUrl = "";

            } catch (err) {
                console.error("Erreur de publication :", err);
                alert("❌ Erreur lors de l'enregistrement : " + err.message);
            } finally {
                publishBtn.disabled = false;
                publishBtn.textContent = "🚀 Publier sur la Plateforme";
            }
        });
    }
}
