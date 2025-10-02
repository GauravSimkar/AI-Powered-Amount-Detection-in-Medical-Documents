// amountRoutes.js - ADD MISSING IMPORT
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // ⬅️ ADD THIS MISSING IMPORT
import {
  handleOCR,
  handleNormalization,
  handleClassification,
  handleFinalOutput,
  handleFullPipeline
} from '../controllers/amountController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ---------------- MULTER CONFIG ---------------- //
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage, // Memory storage only
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
// ---------------- ROUTES ---------------- //
router.post('/ocr', upload.single('image'), handleOCR);
router.post('/normalize', handleNormalization);
router.post('/classify', handleClassification);
router.post('/final', handleFinalOutput);
router.post('/detect-amounts', upload.single('image'), handleFullPipeline);

export default router;