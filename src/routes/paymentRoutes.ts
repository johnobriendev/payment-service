// src/routes/paymentRoutes.ts
import express, { Router, RequestHandler } from 'express';
import { 
  createPaymentController, 
  webhookController, 
  createCheckoutController,
  cancelSessionController 
} from '../controllers/paymentController';

const router = Router();

// Type our controllers for better type safety
const typedCreatePaymentController: RequestHandler = createPaymentController;
const typedWebhookController: RequestHandler = webhookController;
const typedCheckoutController: RequestHandler = createCheckoutController;
const typedCancelSessionController: RequestHandler = cancelSessionController;

// Regular routes use JSON parsing
router.post('/create', express.json(), typedCreatePaymentController);
router.post('/create-checkout', express.json(), typedCheckoutController);
router.post('/cancel-session', express.json(), typedCancelSessionController); 


// Webhook route needs raw body
router.post(
  '/webhook', 
  express.raw({ type: 'application/json' }), 
  typedWebhookController
);

export default router;