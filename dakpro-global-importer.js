    async searchProducts(keyword) {
        const grid = document.getElementById('cj-products-grid');
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #FBBF24; padding: 50px; font-weight: 600;">Recherche en cours dans le catalogue CJ...</div>';

        try {
            // Nouvelle URL directe vers la fonction Serverless Vercel
            const response = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}&pageNum=${this.currentPage}`);
            const data = await response.json();

            if (data.success && data.data && (data.data.list || data.data.length)) {
                const products = data.data.list || data.data;
                this.renderProducts(products);
            } else {
                grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #EF4444; padding: 50px; background: #111827; border-radius: 12px;">Aucun produit trouvé pour cette recherche.</div>';
            }
        } catch (error) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #EF4444; padding: 50px; background: #111827; border-radius: 12px;">Erreur de communication : ${error.message}</div>`;
        }
    }
