// ============================================================
// DAKPRO ÉLITE — dakpro-cj-publisher.js
// MODULE DE PUBLICATION UNIFIÉ AVEC CATÉGORIES VISUELLES (ICÔNE EN HAUT, NOM EN BAS),
// LIENS D'AFFILIATION, COMMISSIONS ET MULTI-VARIANTES ILLIMITÉES
// ============================================================

import {
    getDatabase,
    ref,
    push,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { init as returnToCatalog } from "./dakpro-global-importer.js";

const CONFIG = {
    API: "https://cj.dakproelite.com/api/cj",
    exchangeRate: 655,
    marginPercent: 30,
    commissions: { seller: 80, affiliate: 5, platform: 15 },
    timeout: 30000
};

/* CATALOGUE DES GROUPES DE CATÉGORIES AVEC ICÔNES ET SOUS-CATÉGORIES */
const categoryGroups = [
{
    title: "🚗 VÉHICULES ET TRANSPORT",
    categories: [
        ["🚗", "Voitures"], ["🚙", "SUV et 4x4"], ["🚘", "Berlines"], ["🏎️", "Voitures sportives"],
        ["🚐", "Minibus et fourgonnettes"], ["🚚", "Camions"], ["🚌", "Autobus et autocars"], ["🏍️", "Motos"],
        ["⚡", "Motos électriques"], ["⛽", "Motos à essence"], ["🛵", "Scooters"], ["🛺", "Tricycles motorisés"],
        ["🚲", "Vélos"], ["⚡", "Vélos électriques"], ["🛴", "Trottinettes électriques"], ["🚜", "Tracteurs"],
        ["🚛", "Véhicules utilitaires"], ["🚑", "Ambulances"], ["🚒", "Véhicules spécialisés"], ["🚤", "Bateaux"],
        ["🛥️", "Bateaux à moteur"], ["✈️", "Aviation"], ["🔩", "Pièces automobiles"], ["🛞", "Pneus et jantes"],
        ["🔋", "Batteries automobiles"], ["🛠️", "Accessoires automobiles"], ["🪖", "Casques de moto"], ["🧰", "Pièces de moto"],
        ["🔌", "Chargeurs pour véhicules électriques"], ["🔧", "Entretien et réparation automobile"]
    ]
},
{
    title: "📱 TÉLÉPHONES ET ÉLECTRONIQUE",
    categories: [
        ["📱", "Téléphones portables"], ["🍎", "Smartphones"], ["📞", "Téléphones classiques"], ["📲", "Téléphones reconditionnés"],
        ["📟", "Téléphones professionnels"], ["💻", "Ordinateurs portables"], ["🖥️", "Ordinateurs de bureau"], ["🖱️", "Souris et claviers"],
        ["📟", "Tablettes"], ["⌚", "Montres connectées"], ["🎧", "Écouteurs"], ["🎧", "Casques audio"],
        ["🔊", "Enceintes"], ["📷", "Appareils photo"], ["📹", "Caméras vidéo"], ["📺", "Téléviseurs"],
        ["📽️", "Projecteurs"], ["🎮", "Consoles de jeux"], ["🕹️", "Manettes de jeux"], ["🖨️", "Imprimantes"],
        ["📡", "Routeurs et modems"], ["🔌", "Chargeurs de téléphone"], ["🔋", "Batteries externes"], ["🛡️", "Coques de téléphone"],
        ["🪟", "Protections d'écran"], ["💾", "Disques durs et SSD"], ["🧠", "Composants informatiques"], ["🔧", "Accessoires informatiques"],
        ["🎙️", "Microphones"], ["💡", "Équipements électroniques"]
    ]
},
{
    title: "👕 MODE, VÊTEMENTS ET CHAUSSURES",
    categories: [
        ["👔", "Chemises homme"], ["👕", "T-shirts homme"], ["👖", "Pantalons homme"], ["🧥", "Vestes homme"],
        ["🤵", "Costumes homme"], ["👞", "Chaussures fermées homme"], ["👟", "Baskets homme"], ["🩴", "Sandales homme"],
        ["👗", "Robes femme"], ["👚", "Chemisiers femme"], ["👖", "Pantalons femme"], ["👠", "Chaussures à talons"],
        ["👡", "Sandales femme"], ["👟", "Baskets femme"], ["🩱", "Maillots de bain"], ["🩲", "Sous-vêtements homme"],
        ["🩱", "Sous-vêtements femme"], ["🧦", "Chaussettes"], ["👶", "Vêtements bébé"], ["🧒", "Vêtements enfants"],
        ["🧢", "Casquettes"], ["🎩", "Chapeaux"], ["🧣", "Écharpes"], ["🧤", "Gants"],
        ["👜", "Sacs à main"], ["🎒", "Sacs à dos"], ["💼", "Sacs professionnels"], ["🧳", "Valises"],
        ["👗", "Vêtements traditionnels"], ["🧵", "Tissus et textiles"]
    ]
},
{
    title: "💍 BIJOUX, MONTRES ET ACCESSOIRES",
    categories: [
        ["⌚", "Montres homme"], ["⌚", "Montres femme"], ["💍", "Bagues"], ["📿", "Colliers"],
        ["📿", "Bracelets"], ["💎", "Bijoux en pierres"], ["🥇", "Bijoux en or"], ["🥈", "Bijoux en argent"],
        ["👂", "Boucles d'oreilles"], ["🕶️", "Lunettes de soleil"], ["👓", "Lunettes de vue"], ["👛", "Portefeuilles"],
        ["🔑", "Porte-clés"], ["🎀", "Accessoires de cheveux"], ["🧷", "Accessoires de mode"]
    ]
},
{
    title: "💄 BEAUTÉ, COSMÉTIQUES ET SOINS",
    categories: [
        ["💄", "Maquillage"], ["🧴", "Soins du visage"], ["🧴", "Soins du corps"], ["🧼", "Savons"],
        ["🌸", "Parfums femme"], ["🌿", "Parfums homme"], ["💅", "Produits pour les ongles"], ["💇", "Produits capillaires"],
        ["🪮", "Brosses et peignes"], ["💈", "Matériel de coiffure"], ["🧔", "Soins pour la barbe"], ["🪒", "Rasoirs"],
        ["🪥", "Hygiène bucco-dentaire"], ["🧖", "Soins et spa"], ["💆", "Appareils de massage"], ["🪞", "Miroirs de beauté"],
        ["💅", "Accessoires de manucure"], ["🧴", "Cosmétiques professionnels"]
    ]
},
{
    title: "🏠 MAISON, MEUBLES ET DÉCORATION",
    categories: [
        ["🛋️", "Canapés"], ["🛏️", "Lits"], ["🪑", "Chaises"], ["🪑", "Tables"],
        ["🗄️", "Armoires et rangements"], ["🪞", "Miroirs"], ["🖼️", "Décoration murale"], ["💡", "Lampes et luminaires"],
        ["🪟", "Rideaux"], ["🛏️", "Literie"], ["🛁", "Salle de bain"], ["🚿", "Douches et robinetterie"],
        ["🧹", "Nettoyage domestique"], ["🧺", "Paniers et rangement"], ["🪴", "Plantes décoratives"], ["🕯️", "Bougies décoratives"],
        ["🧸", "Décoration intérieure"], ["🪵", "Meubles en bois"], ["🪟", "Portes et fenêtres"], ["🧯", "Sécurité domestique"]
    ]
},
{
    title: "🍳 CUISINE ET ÉLECTROMÉNAGER",
    categories: [
        ["🍳", "Ustensiles de cuisine"], ["🍽️", "Vaisselle"], ["🥄", "Couverts"], ["🍲", "Marmites et casseroles"],
        ["☕", "Cafetières"], ["🧃", "Mixeurs et blenders"], ["🍟", "Friteuses à air"], ["🔥", "Cuisinières"],
        ["♨️", "Plaques de cuisson"], ["🧊", "Réfrigérateurs"], ["🧺", "Machines à laver"], ["🧹", "Aspirateurs"],
        ["🌬️", "Ventilateurs"], ["❄️", "Climatiseurs"], ["🔥", "Fours électriques"], ["📦", "Fours à micro-ondes"],
        ["💧", "Distributeurs d'eau"], ["🥤", "Extracteurs de jus"], ["🍞", "Grille-pain"], ["⚡", "Générateurs électriques"],
        ["🔋", "Onduleurs"], ["☀️", "Panneaux solaires"]
    ]
},
{
    title: "👶 BÉBÉS, ENFANTS ET JOUETS",
    categories: [
        ["👶", "Produits pour nouveau-nés"], ["🍼", "Biberons"], ["🛒", "Poussettes"], ["🪑", "Chaises hautes bébé"],
        ["🛏️", "Lits pour bébé"], ["🧸", "Peluches"], ["🧩", "Puzzles"], ["🧱", "Jeux de construction"],
        ["🚂", "Jouets éducatifs"], ["🚗", "Voitures miniatures"], ["🎎", "Poupées"], ["🎮", "Jeux électroniques"],
        ["⚽", "Jouets sportifs"], ["🎨", "Matériel créatif enfant"], ["🎒", "Sacs d'école enfant"], ["🧷", "Couches et accessoires bébé"],
        ["🛡️", "Sécurité enfant"]
    ]
},
{
    title: "🏋️ SPORT, FITNESS ET PLEIN AIR",
    categories: [
        ["⚽", "Football"], ["🏀", "Basketball"], ["🏐", "Volleyball"], ["🎾", "Tennis"],
        ["🏸", "Badminton"], ["🏓", "Tennis de table"], ["🥊", "Boxe"], ["🏋️", "Musculation"],
        ["🚴", "Cyclisme"], ["🏃", "Course à pied"], ["🧘", "Yoga"], ["🏊", "Natation"],
        ["🎣", "Pêche"], ["⛺", "Camping"], ["🥾", "Randonnée"], ["🎒", "Sacs de sport"],
        ["👟", "Chaussures de sport"], ["👕", "Vêtements de sport"], ["🛹", "Skateboards"], ["🛶", "Canoës et kayaks"]
    ]
},
{
    title: "🩺 SANTÉ ET BIEN-ÊTRE",
    categories: [
        ["🌡️", "Thermomètres"], ["🩺", "Équipements médicaux"], ["🩹", "Premiers secours"], ["🩸", "Appareils de mesure"],
        ["🦽", "Fauteuils roulants"], ["🦯", "Aides à la mobilité"], ["👓", "Optique"], ["🛏️", "Matériel de confort"],
        ["💆", "Appareils de massage"], ["🧘", "Relaxation et bien-être"], ["🛡️", "Équipements de protection"], ["🧴", "Hygiène personnelle"]
    ]
},
{
    title: "📚 LIVRES, ÉCOLE ET BUREAU",
    categories: [
        ["📚", "Livres"], ["📓", "Cahiers"], ["✏️", "Stylos et crayons"], ["🎒", "Fournitures scolaires"],
        ["📐", "Matériel de géométrie"], ["🎨", "Dessin et peinture"], ["🖨️", "Imprimantes et scanners"], ["📄", "Papier"],
        ["📁", "Classement et archivage"], ["🖇️", "Accessoires de bureau"], ["🪑", "Mobilier de bureau"], ["🧮", "Calculatrices"],
        ["🎓", "Matériel universitaire"], ["📖", "Livres numériques et éducatifs"]
    ]
},
{
    title: "🛠️ OUTILS, INDUSTRIE ET CONSTRUCTION",
    categories: [
        ["🔨", "Marteaux"], ["🪛", "Tournevis"], ["🔧", "Clés et outils mécaniques"], ["🪚", "Scies"],
        ["⚡", "Outils électriques"], ["🧰", "Boîtes à outils"], ["🪜", "Échelles"], ["🧱", "Matériaux de construction"],
        ["🎨", "Peintures et revêtements"], ["🚰", "Plomberie"], ["🔌", "Matériel électrique"], ["🦺", "Équipements de sécurité"],
        ["🏗️", "Machines de chantier"], ["⚙️", "Machines industrielles"], ["🔩", "Vis et boulons"], ["🪵", "Bois de construction"],
        ["🧲", "Équipements techniques"]
    ]
},
{
    title: "🌱 JARDIN, AGRICULTURE ET ÉLEVAGE",
    categories: [
        ["🌱", "Graines"], ["🪴", "Plantes et fleurs"], ["🌾", "Matériel agricole"], ["🚜", "Machines agricoles"],
        ["💧", "Irrigation"], ["🪴", "Pots et jardinières"], ["✂️", "Outils de jardin"], ["🌿", "Engrais"],
        ["🐔", "Élevage de volailles"], ["🐄", "Élevage bovin"], ["🐟", "Aquaculture"], ["🐝", "Apiculture"],
        ["🌽", "Produits agricoles"], ["🧺", "Récolte et stockage"]
    ]
},
{
    title: "🐶 ANIMAUX ET ACCESSOIRES",
    categories: [
        ["🐶", "Chiens"], ["🐱", "Chats"], ["🐦", "Oiseaux"], ["🐠", "Poissons d'aquarium"],
        ["🐹", "Petits animaux"], ["🥣", "Gamelles"], ["🛏️", "Paniers pour animaux"], ["🦮", "Laisses et colliers"],
        ["🧸", "Jouets pour animaux"], ["🧼", "Hygiène animale"], ["🏠", "Cages et abris"], ["🐾", "Accessoires animaliers"]
    ]
},
{
    title: "🥫 ALIMENTATION ET BOISSONS",
    categories: [
        ["🍚", "Riz et céréales"], ["🌽", "Farines"], ["🫘", "Légumineuses"], ["🛢️", "Huiles alimentaires"],
        ["🥫", "Conserves"], ["🍪", "Biscuits et snacks"], ["🍫", "Chocolats et confiseries"], ["☕", "Café"],
        ["🍵", "Thé et infusions"], ["🧃", "Jus et boissons"], ["💧", "Eau"], ["🧂", "Épices et condiments"],
        ["🥛", "Produits laitiers"], ["🍯", "Miel"], ["🍼", "Alimentation infantile"], ["🎁", "Paniers alimentaires"]
    ]
},
{
    title: "🎵 MUSIQUE, LOISIRS ET DIVERTISSEMENT",
    categories: [
        ["🎸", "Guitares"], ["🎹", "Claviers et pianos"], ["🥁", "Batteries et percussions"], ["🎤", "Matériel de chant"],
        ["🎧", "Équipements DJ"], ["🔊", "Sonorisation"], ["🎬", "Matériel audiovisuel"], ["🎲", "Jeux de société"],
        ["🃏", "Cartes et jeux"], ["🎨", "Loisirs créatifs"], ["🎁", "Articles cadeaux"], ["🎉", "Décoration de fête"],
        ["📸", "Accessoires photo"]
    ]
},
{
    title: "💼 ENTREPRISES ET SERVICES PROFESSIONNELS",
    categories: [
        ["🏢", "Équipements professionnels"], ["🏨", "Matériel hôtelier"], ["🍽️", "Matériel de restaurant"], ["🛒", "Équipements commerciaux"],
        ["📦", "Emballages"], ["🏷️", "Étiquettes et marquage"], ["🧾", "Matériel de caisse"], ["🧑‍🍳", "Matériel de cuisine professionnelle"],
        ["🧹", "Matériel de nettoyage professionnel"], ["🦺", "Vêtements de travail"], ["🪑", "Mobilier professionnel"], ["🖥️", "Équipements informatiques professionnels"]
    ]
},
{
    title: "🎁 AUTRES CATÉGORIES",
    categories: [
        ["🎁", "Articles divers"], ["♻️", "Produits recyclés"], ["🧵", "Produits artisanaux"], ["🌍", "Produits locaux"],
        ["🏷️", "Promotions et bonnes affaires"], ["✨", "Nouveautés"], ["📦", "Lots et ventes en gros"], ["🛍️", "Autres produits"]
    ]
}
];

const presetTaillesVetements = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "Standard / Unique"];
const presetPointuresChaussures = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"];

let selectedSizesArray = [];
let variantsArray = [];
let selectedCategoryValue = "";

function cleanImageUrl(url) {
    if (!url) return "https://i.postimg.cc/WpSc29mX/file-00000000ca8872438c17222eb828bc0c.png";
    let trimmed = String(url).trim();
    if (trimmed.startsWith("//")) {
        return "https:" + trimmed;
    }
    return trimmed;
}

class DakproCJPublisher {
    constructor(product, containerId = "module-container") {
        this.product = product || {};
        this.product.image = cleanImageUrl(this.product.image);

        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.db = getDatabase();
        this.auth = getAuth();
        this.variants = [];

        selectedCategoryValue = this.product.categoryName || "";

        this.render();
        this.fetchDetailsAndVariants();
    }

    render() {
        const initialPriceUSD = Number(this.product.price || 0);
        const defaultFCFA = Math.round(initialPriceUSD * CONFIG.exchangeRate * (1 + CONFIG.marginPercent / 100));

        this.container.innerHTML = `
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
        <style>
            * { box-sizing: border-box; }
            .pub-container { width: 100%; color: #f5f5f7; font-family: system-ui, -apple-system, sans-serif; background: #0d0d11; padding: 15px; border-radius: 12px; }
            .pub-title { color: #ffcc00; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; border-left: 4px solid #ffcc00; padding-left: 10px; display: flex; justify-content: space-between; align-items: center; }
            .dakcj-back-btn { background: #16161c; color: #ffcc00; border: 1px solid #ffcc00; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; text-transform: none; }
            .pub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
            .pub-card { background: #13131a; border: 1px solid #282836; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, .5); }
            .pub-card-title { font-size: 14px; font-weight: 900; color: #ffcc00; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #282836; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
            
            .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; }
            .form-group label { font-size: 11px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
            .form-group label i { color: #ffcc00; }
            .form-group input, .form-group select, .form-group textarea { width: 100%; background: #0d0d11; border: 1px solid #282836; color: #ffcc00; padding: 10px 12px; border-radius: 6px; font-size: 13px; outline: none; }
            .form-group textarea { resize: vertical; min-height: 90px; }

            .price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            
            .checkbox-group { display: flex; gap: 15px; margin-bottom: 15px; background: #0a0c10; padding: 10px; border-radius: 8px; border: 1px solid #282836; }
            .checkbox-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #ffcc00; font-weight: 700; cursor: pointer; }
            .checkbox-item input { width: auto; cursor: pointer; }

            /* DESIGN CATÉGORIES VISUELLES : ICÔNE EN HAUT, NOM EN BAS */
            .category-picker-box { background: #0a0c10; border: 1px solid #282836; border-radius: 8px; padding: 12px; margin-bottom: 15px; max-height: 350px; overflow-y: auto; }
            .cat-search-input { width: 100%; padding: 10px; font-size: 12px; border: 1px solid #282836; border-radius: 6px; background: #050505; color: #ffcc00; margin-bottom: 12px; outline: none; }
            .cat-section { margin-bottom: 15px; }
            .cat-section h4 { font-size: 12px; margin: 0 0 8px; color: #ffcc00; border-bottom: 1px solid #282836; padding-bottom: 4px; }
            .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(95px, 1fr)); gap: 8px; }
            .cat-card { border: 1px solid #282836; border-radius: 8px; padding: 12px 6px; text-align: center; cursor: pointer; background: #13131a; transition: 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .cat-card:hover { border-color: #ffcc00; transform: translateY(-2px); }
            .cat-card.selected { border: 2px solid #ffcc00; background: #2a250a; }
            .cat-icon { display: block; font-size: 26px; margin-bottom: 6px; line-height: 1; }
            .cat-name { font-size: 10.5px; color: #f5f5f7; line-height: 1.25; word-break: break-word; font-weight: 600; }

            .size-box { background: #0a0c10; border: 1px dashed #282836; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
            .size-title { font-size: 11px; font-weight: 800; color: #ffcc00; margin-bottom: 8px; text-transform: uppercase; }
            .size-chips-wrapper { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; max-height: 120px; overflow-y: auto; }
            .size-chip { padding: 5px 10px; background: #181824; border: 1px solid #333; border-radius: 6px; font-size: 11px; color: #ddd; cursor: pointer; user-select: none; transition: .15s; }
            .size-chip.active { background: #ffcc00; color: #000; font-weight: 800; border-color: #ffcc00; }

            .variant-box { background: #0a0c10; border: 1px dashed #ffcc00; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
            .variant-title { font-size: 11px; font-weight: 800; color: #ffcc00; margin-bottom: 10px; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; }
            .variant-list { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; max-height: 350px; overflow-y: auto; padding-right: 4px; }
            .variant-card-item { display: flex; flex-direction: column; gap: 6px; background: #13131a; padding: 10px; border-radius: 8px; border: 1px solid #282836; }
            .variant-card-top { display: flex; align-items: center; gap: 10px; }
            .variant-card-top img { width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid #ffcc00; background: #000; flex-shrink: 0; }
            .variant-card-inputs { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 6px; align-items: center; width: 100%; }
            .variant-card-inputs input { background: #050505; border: 1px solid #282836; color: #ffcc00; padding: 6px 8px; border-radius: 4px; font-size: 11px; width: 100%; }
            .btn-remove-variant { color: #ef4444; cursor: pointer; background: transparent; border: none; font-size: 16px; font-weight: 900; padding: 4px 8px; }

            .commission-box { background: #0d0d11; border: 1px solid #ffcc00; border-radius: 8px; padding: 12px; margin-top: 10px; }
            .commission-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
            .commission-input input { width: 100%; background: #050505; border: 1px solid #333; color: #ffcc00; padding: 8px; border-radius: 6px; text-align: center; font-weight: 800; }
            
            .btn-pub-action { background: linear-gradient(135deg, #ffcc00, #e6b800); color: #000; font-weight: 900; border: none; padding: 14px 25px; border-radius: 8px; cursor: pointer; transition: .2s; text-transform: uppercase; font-size: 13px; width: 100%; margin-top: 15px; }
            
            .preview-box { min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0d0d11; border: 1px dashed #282836; border-radius: 8px; padding: 15px; gap: 8px; }
            
            .status-box { margin-bottom: 15px; padding: 10px; border-radius: 8px; font-size: 11px; font-weight: 700; background: #050505; border: 1px solid #282836; color: #ffcc00; text-align: center; }
        </style>

        <div class="pub-container">
            <div class="pub-title">
                <span>📦 Publication CJ — DAKPROÉLITE</span>
                <button type="button" class="dakcj-back-btn" id="dakcj-back">← Retour au Catalogue</button>
            </div>
            <div id="adminPublicationStatus" class="status-box">Produit CJ chargé avec succès. Prêt pour la publication</div>

            <div class="pub-grid">
                <div class="pub-card">
                    <div class="pub-card-title">📝 Informations de l'Article CJ</div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-user"></i> Nom du Vendeur / Boutique</label>
                        <input type="text" id="adminVendeurNom" value="CJdropshipping International">
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-heading"></i> Nom de l'Article</label>
                        <input type="text" id="adminProductName" value="${this.product.name || ''}">
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-icons"></i> Sélectionner la Catégorie (Icône en haut, Nom en bas)</label>
                        <div class="category-picker-box">
                            <input type="search" id="categorySearchInput" class="cat-search-input" placeholder="🔎 Rechercher une catégorie...">
                            <div id="visualCategoriesContainer"></div>
                        </div>
                        <small id="selectedCategoryDisplay" style="color: #22c55e; font-size: 11px; font-weight: 800;">Catégorie active : ${selectedCategoryValue || 'Aucune'}</small>
                    </div>

                    <div class="price-grid">
                        <div class="form-group">
                            <label><i class="fa-solid fa-money-bill"></i> Prix Final calculé (FCFA)</label>
                            <input type="number" id="adminProductPrice" value="${defaultFCFA}" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label><i class="fa-solid fa-tag"></i> Prix Promo (Optionnel)</label>
                            <input type="number" id="adminProductPromoPrice" placeholder="Ex: 22000" min="0" step="0.01">
                        </div>
                    </div>

                    <div class="checkbox-group">
                        <label class="checkbox-item">
                            <input type="checkbox" id="isFlashCheck"> 🔥 Offre Flash
                        </label>
                        <label class="checkbox-item">
                            <input type="checkbox" id="isRecommandeCheck" checked> ⭐ Recommandé / Sponsorisé
                        </label>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-coins"></i> Devise</label>
                        <select id="adminProductCurrency">
                            <option value="FCFA" selected>FCFA — Franc CFA (XOF/XAF)</option>
                            <option value="EUR">EUR — Euro (€)</option>
                            <option value="USD">USD — Dollar ($)</option>
                        </select>
                    </div>

                    <div class="size-box">
                        <div class="size-title">📏 Tailles, Pointures ou Options disponibles</div>
                        <div class="size-chips-wrapper" id="sizePresetContainer"></div>
                        <input type="text" id="customSizeInput" placeholder="Option sur-mesure...">
                    </div>

                    <div class="variant-box">
                        <div class="variant-title">
                            <span>🎨 Variantes CJ & Photos Synchronisées</span>
                            <span id="variantCounter" style="color:#22c55e; font-size:10px;">0 variante(s)</span>
                        </div>
                        <div id="variantList" class="variant-list">
                            <div style="text-align:center; color:#777; font-size:11px; padding:10px;">Chargement automatique des variantes CJ...</div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-align-left"></i> Description unique de l'article</label>
                        <textarea id="adminProductDescription">${this.product.description || ''}</textarea>
                    </div>

                    <div class="commission-box">
                        <div class="commission-title" style="font-size:11px;font-weight:800;color:#ffcc00;margin-bottom:8px;">💰 Commissions Réparties & Comptabilité</div>
                        <div class="commission-grid">
                            <div class="commission-input">
                                <label style="font-size:9px;color:#aaa;">Vendeur (%)</label>
                                <input type="number" id="adminCommissionProduit" value="80" min="0" max="100" style="color:#22c55e;">
                            </div>
                            <div class="commission-input">
                                <label style="font-size:9px;color:#aaa;">Affiliation (%)</label>
                                <input type="number" id="adminCommissionAffiliation" value="5" min="0" max="100" style="color:#ffcc00;">
                            </div>
                            <div class="commission-input">
                                <label style="font-size:9px;color:#aaa;">Plateforme (%)</label>
                                <input type="number" id="adminCommissionPlateforme" value="15" min="0" max="100" style="color:#3b82f6;">
                            </div>
                        </div>
                    </div>

                    <button type="button" id="adminAddProduct" class="btn-pub-action">🚀 Publier l'Article CJ & Générer le Lien d'Affiliation</button>
                </div>

                <div class="pub-card">
                    <div class="pub-card-title">👁️ Aperçu de l'Image Officielle CJ</div>
                    <div id="adminPreviewBox" class="preview-box">
                        <img id="imagePreviewImg" src="${this.product.image}" style="width:100%; max-height:280px; object-fit:contain; border-radius:6px; background:#0b0b0e;" referrerpolicy="no-referrer" crossorigin="anonymous">
                    </div>
                </div>
            </div>
        </div>
        `;

        this.setupEvents();
    }

    setupEvents() {
        document.getElementById("dakcj-back").addEventListener("click", () => returnToCatalog());

        const visualCategoriesContainer = document.getElementById("visualCategoriesContainer");
        const categorySearchInput = document.getElementById("categorySearchInput");
        const selectedCategoryDisplay = document.getElementById("selectedCategoryDisplay");

        const renderVisualCategories = (filter = "") => {
            visualCategoriesContainer.innerHTML = "";
            const q = filter.trim().toLowerCase();

            categoryGroups.forEach(group => {
                const matchedCats = group.categories.filter(([icon, name]) => 
                    name.toLowerCase().includes(q) || group.title.toLowerCase().includes(q)
                );
                if (matchedCats.length === 0) return;

                const section = document.createElement("div");
                section.className = "cat-section";
                section.innerHTML = `<h4>${group.title}</h4>`;

                const grid = document.createElement("div");
                grid.className = "cat-grid";

                matchedCats.forEach(([icon, name]) => {
                    const card = document.createElement("div");
                    card.className = `cat-card ${selectedCategoryValue === name ? 'selected' : ''}`;
                    card.innerHTML = `
                        <span class="cat-icon">${icon}</span>
                        <span class="cat-name">${name}</span>
                    `;
                    card.addEventListener("click", () => {
                        selectedCategoryValue = name;
                        selectedCategoryDisplay.textContent = `Catégorie active : ${name}`;
                        renderVisualCategories(categorySearchInput.value);
                    });
                    grid.appendChild(card);
                });
                section.appendChild(grid);
                visualCategoriesContainer.appendChild(section);
            });
        };

        renderVisualCategories();
        categorySearchInput.addEventListener("input", (e) => renderVisualCategories(e.target.value));

        const sizePresetContainer = document.getElementById("sizePresetContainer");
        const allPresets = [...presetTaillesVetements, ...presetPointuresChaussures, "Standard", "1000W", "2000W", "3000W", "4K Ultra HD", "32Go", "64Go", "128Go"];
        sizePresetContainer.innerHTML = allPresets.map(sz => `<span class="size-chip" data-size="${sz}">${sz}</span>`).join("");

        sizePresetContainer.querySelectorAll(".size-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                chip.classList.toggle("active");
                const sz = chip.dataset.size;
                if (chip.classList.contains("active")) {
                    if (!selectedSizesArray.includes(sz)) selectedSizesArray.push(sz);
                } else {
                    selectedSizesArray = selectedSizesArray.filter(item => item !== sz);
                }
            });
        });

        document.getElementById("adminAddProduct").addEventListener("click", () => this.saveProduct());
    }

    async fetchDetailsAndVariants() {
        if (!this.product.pid) return;
        try {
            const res = await fetch(`${CONFIG.API}?action=variants&pid=${this.product.pid}`);
            const json = await res.json();
            const rawVar = json?.data || [];
            const list = Array.isArray(rawVar) ? rawVar : (rawVar.list || rawVar.variants || []);
            
            variantsArray = list.map((v, i) => {
                let vImg = cleanImageUrl(v.variantImage || v.image || this.product.image);
                return {
                    couleur: v.variantNameEn || v.variantName || `Variante ${i+1}`,
                    prix: Number(v.variantSellPrice || v.sellPrice || this.product.price || 0) * CONFIG.exchangeRate * (1 + CONFIG.marginPercent/100),
                    stock: 50,
                    image: vImg
                };
            });

            this.renderVariantCards();
        } catch (e) {
            console.warn("Variantes CJ partielles :", e);
        }
    }

    renderVariantCards() {
        const variantList = document.getElementById("variantList");
        const variantCounter = document.getElementById("variantCounter");
        if (!variantList) return;

        variantCounter.textContent = `${variantsArray.length} variante(s)`;
        if (variantsArray.length === 0) {
            variantList.innerHTML = `<div style="text-align:center; color:#777; font-size:11px; padding:10px;">Aucune variante CJ spécifique. Produit standard utilisé.</div>`;
            return;
        }

        variantList.innerHTML = variantsArray.map((item, index) => `
            <div class="variant-card-item" data-index="${index}">
                <div class="variant-card-top">
                    <img src="${item.image}" alt="Variante" referrerpolicy="no-referrer" crossorigin="anonymous">
                    <div class="variant-card-inputs">
                        <input type="text" class="var-name-input" value="${item.couleur}" data-index="${index}">
                        <input type="number" class="var-price-input" value="${item.prix || ''}" placeholder="Prix" data-index="${index}">
                        <input type="number" class="var-stock-input" value="${item.stock || 10}" placeholder="Stock" data-index="${index}">
                        <button type="button" class="btn-remove-variant" onclick="window.removeVariantItem(${index})">✕</button>
                    </div>
                </div>
            </div>
        `).join("");

        window.removeVariantItem = (idx) => {
            variantsArray.splice(idx, 1);
            this.renderVariantCards();
        };

        variantList.querySelectorAll(".var-name-input").forEach(inp => {
            inp.addEventListener("input", e => variantsArray[e.target.dataset.index].couleur = e.target.value);
        });
        variantList.querySelectorAll(".var-price-input").forEach(inp => {
            inp.addEventListener("input", e => variantsArray[e.target.dataset.index].prix = e.target.value ? parseFloat(e.target.value) : null);
        });
        variantList.querySelectorAll(".var-stock-input").forEach(inp => {
            inp.addEventListener("input", e => variantsArray[e.target.dataset.index].stock = e.target.value ? parseInt(e.target.value, 10) : 10);
        });
    }

    async saveProduct() {
        const nom = document.getElementById("adminProductName").value.trim();
        const vendeurNom = document.getElementById("adminVendeurNom").value.trim() || "CJdropshipping";
        const prix = parseFloat(document.getElementById("adminProductPrice").value);
        const customSize = document.getElementById("customSizeInput").value.trim();
        const isFlash = document.getElementById("isFlashCheck").checked;
        const isRecommande = document.getElementById("isRecommandeCheck").checked;
        const statusBox = document.getElementById("adminPublicationStatus");
        const publishBtn = document.getElementById("adminAddProduct");

        if (customSize && !selectedSizesArray.includes(customSize)) {
            selectedSizesArray.push(customSize);
        }

        if (!nom || !selectedCategoryValue || isNaN(prix) || prix < 0) {
            return alert("⚠️ Veuillez remplir le nom, choisir une catégorie visuelle et indiquer un prix valide.");
        }

        publishBtn.disabled = true;
        publishBtn.textContent = "⚡ PUBLICATION SUR FIREBASE...";

        try {
            let finalImage = cleanImageUrl(this.product.image);

            const currentUser = window.currentUser || this.auth.currentUser || null;
            const newRef = push(ref(this.db, "publications"));
            const prodId = newRef.key;
            const vendeurUid = currentUser?.uid || "admin_dakpro_id";

            const baseUrl = window.location.origin + window.location.pathname;
            const lienAffiliation = `${baseUrl}?produit=${prodId}&ref=${vendeurUid}`;

            const now = new Date();
            const dateStr = now.toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

            const commVendeurPct = parseFloat(document.getElementById("adminCommissionProduit").value) || 80;
            const commAffiliationPct = parseFloat(document.getElementById("adminCommissionAffiliation").value) || 5;
            const commPlateformePct = parseFloat(document.getElementById("adminCommissionPlateforme").value) || 15;

            const payload = {
                id: prodId,
                nom: nom,
                nom_en: nom,
                titre: nom,
                fournisseur: "CJdropshipping",
                cjPid: String(this.product.pid || ""),
                vendeurNom: vendeurNom,
                vendeurId: vendeurUid,
                categorie: selectedCategoryValue,
                sousCategorie: selectedCategoryValue,
                prix: prix,
                prixPromo: document.getElementById("adminProductPromoPrice").value ? parseFloat(document.getElementById("adminProductPromoPrice").value) : null,
                devise: document.getElementById("adminProductCurrency").value || "FCFA",
                taillesDisponibles: selectedSizesArray,
                variantes: variantsArray,
                image: finalImage,
                description: document.getElementById("adminProductDescription").value.trim(),
                isFlash: isFlash,
                isRecommande: isRecommande,
                lienAffiliation: lienAffiliation,
                commissions: { vendeur: commVendeurPct, affiliation: commAffiliationPct, plateforme: commPlateformePct },
                comptabilite: {
                    montantVendeur: (prix * commVendeurPct) / 100,
                    montantAffilie: (prix * commAffiliationPct) / 100,
                    montantPlateforme: (prix * commPlateformePct) / 100
                },
                actif: true,
                createdBy: vendeurUid,
                createdAt: serverTimestamp(),
                datePublication: dateStr,
                heurePublication: timeStr
            };

            await set(ref(this.db, `publications/${prodId}`), payload);
            await set(ref(this.db, `produits/${prodId}`), payload);

            statusBox.textContent = "✅ PRODUIT CJ PUBLIÉ AVEC SUCCÈS !";
            alert(`🚀 PRODUIT CJ & LIEN D'AFFILIATION PUBLIÉS !\n\n🔗 Lien :\n${lienAffiliation}`);
            returnToCatalog();
        } catch (err) {
            console.error(err);
            alert("❌ Erreur : " + err.message);
            publishBtn.disabled = false;
            publishBtn.textContent = "🚀 Publier l'Article CJ & Générer le Lien d'Affiliation";
        }
    }
}

export function initPublisher(product, containerId = "module-container") {
    return new DakproCJPublisher(product, containerId);
}
