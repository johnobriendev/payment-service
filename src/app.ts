// src/app.ts
import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes';

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies for normal routes
app.use(express.json());

// Use our payment routes
app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;