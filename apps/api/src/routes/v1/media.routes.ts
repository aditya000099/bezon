import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../../controllers/media.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Multer memory storage configuration (keeps file buffers in memory for direct S3 upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit 5MB files
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type whitelist
    const isAllowed = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file format. Only JPG, PNG, and WEBP allowed.') as any, false);
    }
  },
});

// Media Upload Endpoints
router.post('/upload', authenticateUser, requireRole(['customer', 'seller', 'admin', 'delivery']), upload.single('image'), uploadImage);

export default router;
