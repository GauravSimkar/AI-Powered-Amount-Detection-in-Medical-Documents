import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import amountRoutes from './routes/amountRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', amountRoutes);

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