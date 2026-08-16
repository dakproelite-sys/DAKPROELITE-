[15/08 08:16] AGLIGNAMOU: document.getElementById(
    "btnAjouterPanier"
).addEventListener(
    "click",
    async () => {

        if (!produitActuel) {
            return;
        }

        const quantite = Math.max(
            1,
            Number(
                quantiteInput.value
            ) || 1
        );

        let article = {
            id:
                produitActuel.id,

            nom:
                produitActuel.nom ||
                produitActuel.titre ||
                "Produit",

            prix:
                obtenirPrixPromotion(
                    produitActuel
                ),

            prixReel:
                nombre(
                    produitActuel.prix
                ),

            prixPromotion:
                obtenirPrixPromotion(
                    produitActuel
                ),

            image:
                produitActuel.image ||
                produitActuel.imageUrl ||
                "",

            vendeurId:
                produitActuel.vendeurId ||
                produitActuel.sellerId ||
                "",

            vendeurNom:
                produitActuel.vendeurNom ||
                produitActuel.sellerName ||
                "",

            categorie:
                produitActuel.categorie ||
                "",

            quantite:
                quantite
        };


        /*
         * =====================================================
         * AFFILIATION
         * =====================================================
         *
         * On ne recrée pas le système d'affiliation.
         * On utilise js/produit-affiliation.js.
         */

        if (
            window.DAKPROProduitAffiliation &&
            typeof
                window.DAKPROProduitAffiliation
                    .ajouterAuPanier ===
                "function"
        ) {

            article =
                window.DAKPROProduitAffiliation
                    .ajouterAuPanier(
                        article
                    );
        }


        /*
         * =====================================================
         * PANIER EXISTANT
         * =====================================================
         */

        if (
            typeof window.ajouterAuPanier ===
            "function"
        ) {

            const resultat =
                await window.ajouterAuPanier(
                    article
                );

            if (
                resultat === false
            ) {
                return;
            }

        } else {

            const panier =
                JSON.parse(
                    localStorage.getItem(
                        "dakpro_panier"
                    ) || "[]"
                );


            const index =
                panier.findIndex(
                    item =>
                        item.id ===
                        article.id
                );


            if (index >= 0) {

                panier[index].quantite =
                    (
                        Number(
                            panier[index].quantite
                        ) || 0
                    ) + quantite;


                /*
                 * Si une affiliation existe,
                 * elle reste attachée à l'article.
                 */

                if (
                    article.affiliationRef
                ) {

                    panier[index]
                        .affiliationRef =
                        article.affiliationRef;

                    panier[index]
                        .affiliéId =
                        article.affiliéId;

                    panier[index]
                        .affiliationDate =
                        article.affiliationDate;
                }

            } else {

                panier.push(
                    article
                );
            }


            localStorage.setItem(
                "dakpro_panier",
                JSON.stringify(
                    panier
                )
            );
        }


        /*
         * Mise à jour compteur.
         */

        if (
            typeof window.updateCartCounter ===
            "function"
        ) {

            window.updateCartCounter();

        } else {

            const panier =
                JSON.parse(
                    localStorage.getItem(
                        "dakpro_panier"
                    ) || "[]"
                );


            const total =
                panier.reduce(
                    (
                        somme,
                        item
                    ) =>
                        somme +
                        (
                            Number(
                                item.quantite
                            ) || 0
                        ),
                    0
                );


            document.getElementById(
                "compteurPanier"
            ).textContent =
                total;
        }


        /*
         * Confirmation.
         */

        alert(
            article.affiliationRef
                ? "Produit ajouté au panier avec votre référence d'affiliation."
                : "Produit ajouté au panier."
        );
    }
);
[15/08 08:17] AGLIGNAMOU: import "./js/produit-affiliation.js";