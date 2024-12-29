// src/controllers/paymentController.ts
import { Request, Response } from 'express';
 
import { 
  createPaymentIntent, 
  PaymentError, 
  handleStripeWebhook, 
  createCheckoutSession,
  cancelCheckoutSession 
} from '../services/payment';



// Define the expected structure of our payment request
interface CreatePaymentRequest {
  duration: number;
  isPackage: boolean;
}
interface CancelSessionRequest {
  sessionId: string;
}


export async function createPaymentController(req: Request, res: Response): Promise<void> {
  // Extract and validate the request body according to our interface
  const { duration, isPackage } = req.body as CreatePaymentRequest;

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
    const paymentIntent = await createPaymentIntent(duration, isPackage);
    res.json({
      success: true,
      clientSecret: paymentIntent.clientSecret,
      amount: paymentIntent.amount
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      res.status(400).json({
        success: false,
        error: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create payment'
    });
  }
}

export async function createCheckoutController(req: Request, res: Response): Promise<void> {
  console.log('Received checkout request with body:', req.body);
  const { duration, isPackage } = req.body;

  // Validate the duration
  if (!duration) {
    res.status(400).json({
      success: false,
      error: 'Duration is required for the lesson booking'
    });
    return;
  }

  if (![30, 45, 60].includes(duration)) {
    res.status(400).json({
      success: false,
      error: 'Please select a valid duration: 30, 45, or 60 minutes'
    });
    return;
  }

  if (typeof isPackage !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'Please specify whether this is a package booking'
    });
    return;
  }

  try {
    console.log('Creating checkout session for:', { duration, isPackage });
    const session = await createCheckoutSession(duration, isPackage);
    console.log('Created checkout session:', session);
    
    res.json({
      success: true,
      sessionId: session.sessionId,
      message: 'Checkout session created successfully'
    });
  } catch (error) {
    console.error('Detailed checkout error:', {
      error,
      requestBody: req.body,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({
      success: false,
      error: 'Unable to create checkout session. Please try again.'
    });
  }
}

export async function cancelSessionController(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.body;

  
  if (!sessionId) {
    res.status(400).json({
      success: false,
      error: 'Session ID is required'
    });
    return;
  }

  try {
    // The service handles all the complex logic now
    await cancelCheckoutSession(sessionId);
    
    // We just need to send back a success response
    res.json({ 
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    // Handle errors based on their type
    if (error instanceof PaymentError) {
      // Business logic errors get a 400 status
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      // Unexpected errors get a 500 status
      console.error('Unexpected error during session cancellation:', error);
      res.status(500).json({ 
        success: false, 
        error: 'An unexpected error occurred while cancelling the session' 
      });
    }
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
    await handleStripeWebhook(payload);
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
}