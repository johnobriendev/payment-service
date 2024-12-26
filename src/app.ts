// src/app.ts
import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes';

const app = express();

// Enable CORS
app.use(cors());

app.use(express.static('public'));
// Parse JSON bodies for normal routes
app.use(express.json());

// Use our payment routes
app.use('/api/payments', paymentRoutes);

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack);
    res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
};

// Register error handling middleware
app.use(errorHandler);


// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});


// Only start the server if we're not in a test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;