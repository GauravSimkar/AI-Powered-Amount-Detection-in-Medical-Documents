import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import amountRoutes from './routes/amountRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', amountRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI-Powered Amount Detection API',
    version: '1.0.0',
    endpoints: {
      ocr: 'POST /api/ocr',
      normalize: 'POST /api/normalize',
      classify: 'POST /api/classify',
      final: 'POST /api/final',
      detectAmounts: 'POST /api/detect-amounts'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});

export default app;