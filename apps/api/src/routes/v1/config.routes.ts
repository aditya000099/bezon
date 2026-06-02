import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Expose the API key only to authenticated users to prevent public scraping
router.get('/google-maps-key', authenticateUser, (req, res) => {
  res.json({
    success: true,
    data: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    },
  });
});

export default router;
