import { Router } from 'express';
import {
  scrapeOffers,
  scrapeSearch,
  scrapeProductPage,
} from '../controllers/scraperController.js';

const router = Router();

router.get('/offers', scrapeOffers);
router.get('/search', scrapeSearch);
router.post('/product', scrapeProductPage);

export default router;
