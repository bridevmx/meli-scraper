import {
  scrapeOffers as scrapeOffersService,
  scrapeSearch as scrapeSearchService,
  scrapeProductPage as scrapeProductPageService,
} from '../services/scraper.js';

export const scrapeOffers = async (req, res) => {
  try {
    const { maxPages } = req.query;
    const products = await scrapeOffersService(maxPages);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const scrapeSearch = async (req, res) => {
  try {
    const { q, maxPages } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }
    const products = await scrapeSearchService(q, maxPages);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const scrapeProductPage = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Body parameter "url" is required.' });
    }
    const productDetails = await scrapeProductPageService(url);
    res.json(productDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
