
document.addEventListener('DOMContentLoaded', () => {
    const scrapeOffersBtn = document.getElementById('scrape-offers');
    const scrapeSearchBtn = document.getElementById('scrape-search');
    const scrapeProductBtn = document.getElementById('scrape-product');
    const resultsPre = document.getElementById('results');

    scrapeOffersBtn.addEventListener('click', async () => {
        const maxPages = document.getElementById('offers-max-pages').value;
        try {
            const response = await fetch(`/api/scraper/offers?maxPages=${maxPages}`);
            const data = await response.json();
            resultsPre.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            resultsPre.textContent = `Error: ${error.message}`;
        }
    });

    scrapeSearchBtn.addEventListener('click', async () => {
        const query = document.getElementById('search-query').value;
        const maxPages = document.getElementById('search-max-pages').value;
        if (!query) {
            alert('Please enter a search query.');
            return;
        }
        try {
            const response = await fetch(`/api/scraper/search?q=${query}&maxPages=${maxPages}`);
            const data = await response.json();
            resultsPre.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            resultsPre.textContent = `Error: ${error.message}`;
        }
    });

    scrapeProductBtn.addEventListener('click', async () => {
        const url = document.getElementById('product-url').value;
        if (!url) {
            alert('Please enter a product URL.');
            return;
        }
        try {
            const response = await fetch('/api/scraper/product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            const data = await response.json();
            resultsPre.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            resultsPre.textContent = `Error: ${error.message}`;
        }
    });
});
