import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
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
  storage: storage,
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

// Step 1: OCR/Text Extraction - accept both JSON and image
router.post('/ocr', upload.single('image'), handleOCR);

// Step 2: Normalization
router.post('/normalize', express.json(), handleNormalization);

// Step 3: Classification  
router.post('/classify', express.json(), handleClassification);

// Step 4: Final Output
router.post('/final', express.json(), handleFinalOutput);

// Full Pipeline
router.post('/detect-amounts', upload.single('image'), handleFullPipeline);

// Add a test endpoint for debugging
router.post('/test-classification', express.json(), async (req, res) => {
  try {
    const { amounts, text } = req.body;
    const classificationService = await import('../services/classificationService.js');
    const result = await classificationService.default.classify(amounts, text, 'fast');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;
