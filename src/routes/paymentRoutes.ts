// src/routes/paymentRoutes.ts
import express, { Router, Request, Response, RequestHandler } from 'express';
import { createPaymentController, webhookController, createCheckoutController } from '../controllers/paymentController';

const router = Router();

const typedCreatePaymentController: RequestHandler = createPaymentController;
const typedWebhookController: RequestHandler = webhookController;
const typedCheckoutController: RequestHandler = createCheckoutController;

router.post('/create', typedCreatePaymentController);
router.post('/webhook', express.raw({ type: 'application/json' }), typedWebhookController);
router.post('/create-checkout', typedCheckoutController);


export default router;