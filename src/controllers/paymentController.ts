// src/controllers/paymentController.ts
import { Request, Response } from 'express';
import { createPaymentIntent, PaymentError, handleStripeWebhook, createCheckoutSession } from '../services/payment';

interface CreatePaymentRequest {
  duration: number;
  isPackage: boolean;
}

export async function createPaymentController(req: Request, res: Response): Promise<void> {
  const { duration, isPackage } = req.body as CreatePaymentRequest;

  // Check if duration exists and is one of our valid options
  if (!duration) {
    res.status(400).json({
      success: false,
      error: 'Duration is required'
    });
    return;
  }

  // Validate that duration is one of our accepted values
  if (![30, 45, 60].includes(duration)) {
    res.status(400).json({
      success: false,
      error: 'Invalid duration. Must be 30, 45, or 60 minutes'
    });
    return;
  }

  // isPackage should be a boolean
  if (typeof isPackage !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'isPackage must be a boolean value'
    });
    return;
  }

  try {
    // If validation passes, call payment service
    const paymentIntent = await createPaymentIntent(duration, isPackage);

    // Send successful response with payment details
    res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      amount: paymentIntent.amount
    });
  } catch (error) {
    // Handle different types of errors appropriately
    if (error instanceof PaymentError) {
      // Known payment-related errors get a 400 status
      res.status(400).json({
        success: false,
        error: error.message
      });
      return;
    }

    // Log unexpected errors (in a real app, use proper logging)
    //console.error('Payment creation error:', error);

    // Unknown errors get a 500 status
    res.status(500).json({
      success: false,
      error: 'Failed to create payment'
    });
  }
}

export async function webhookController(req: Request, res: Response): Promise<void> {
  const payload = req.body;
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    res.status(400).json({
      success: false,
      error: 'Missing stripe signature'
    });
    return;
  }

  try {
    const event = payload;
    await handleStripeWebhook(event);
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
}

export async function createCheckoutController(req: Request, res: Response): Promise<void> {
  const { duration, isPackage } = req.body;

  // Validate input just like in our original controller
  if (!duration) {
    res.status(400).json({
      success: false,
      error: 'Duration is required'
    });
    return;
  }

  if (![30, 45, 60].includes(duration)) {
    res.status(400).json({
      success: false,
      error: 'Invalid duration. Must be 30, 45, or 60 minutes'
    });
    return;
  }

  if (typeof isPackage !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'isPackage must be a boolean value'
    });
    return;
  }

  try {
    // Create the checkout session using our service
    const session = await createCheckoutSession(duration, isPackage);
    
    // Return the session ID to the client
    res.json({ sessionId: session.sessionId });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
}