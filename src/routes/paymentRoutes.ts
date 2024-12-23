// src/routes/paymentRoutes.ts
import express, { Router, Request, Response, RequestHandler } from 'express';
import { createPaymentController, webhookController } from '../controllers/paymentController';

const router = Router();

// Type the controllers as RequestHandler
const typedCreatePaymentController: RequestHandler = createPaymentController;
const typedWebhookController: RequestHandler = webhookController;

// Use the typed controllers in routes
router.post('/create', typedCreatePaymentController);

router.post(
  '/webhook', 
  express.raw({ type: 'application/json' }), 
  typedWebhookController
);

export default router;