// src/routes/paymentRoutes.ts
import express, { Router, RequestHandler } from 'express';
import { 
  createPaymentController, 
  webhookController, 
  createCheckoutController 
} from '../controllers/paymentController';

const router = Router();

// Type our controllers for better type safety
const typedCreatePaymentController: RequestHandler = createPaymentController;
const typedWebhookController: RequestHandler = webhookController;
const typedCheckoutController: RequestHandler = createCheckoutController;

// Regular routes use JSON parsing
router.post('/create', express.json(), typedCreatePaymentController);
router.post('/create-checkout', express.json(), typedCheckoutController);

// Webhook route needs raw body
router.post(
  '/webhook', 
  express.raw({ type: 'application/json' }), 
  typedWebhookController
);

export default router;