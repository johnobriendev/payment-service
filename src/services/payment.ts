// src/services/payment.ts
import { PrismaClient } from '@prisma/client';
import stripe from '../config/stripe';
import { calculateAmount } from '../utils/pricing';

export interface PaymentIntentResult {
  clientSecret: string;
  amount: number;
}

// Base interface for all Stripe webhook events
interface BaseStripeEvent {
  type: string;
  data: {
    object: any;
  };
}

// Specific interface for payment intent webhook events
interface PaymentIntentEvent extends BaseStripeEvent {
  data: {
    object: {
      id: string;
      status: string;
    };
  };
}

// Specific interface for checkout session webhook events
interface CheckoutSessionEvent extends BaseStripeEvent {
  data: {
    object: {
      id: string;
      payment_intent?: string;  // Optional because it might not always be present
      status: string;
    };
  };
}

// Union type that can be either type of webhook event
type StripeWebhookEvent = PaymentIntentEvent | CheckoutSessionEvent;

// Interface for what we return after creating a checkout session
export interface CheckoutSessionResult {
  sessionId: string;
}

// Custom error class for payment-related errors
export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

// Initialize our database client
const prisma = new PrismaClient();

// Function to create a payment intent for the custom payment form
export async function createPaymentIntent(
  duration: number,
  isPackage: boolean
): Promise<PaymentIntentResult> {
  try {
    const amountInDollars = calculateAmount(duration, isPackage);
    const amountInCents = amountInDollars * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Create a booking record in our database
    await prisma.booking.create({
      data: {
        duration,
        isPackage,
        amount: amountInDollars,
        paymentIntentId: paymentIntent.id,
        status: 'PENDING'
      }
    });

    if (!paymentIntent.client_secret) {
      throw new PaymentError('Missing client secret in payment intent');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      amount: amountInDollars
    };
    
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Invalid lesson duration') {
      throw error;
    }
    throw new PaymentError('Failed to create payment intent');
  }
}

// Function to create a checkout session for Stripe Checkout
export async function createCheckoutSession(
  duration: number,
  isPackage: boolean
): Promise<CheckoutSessionResult> {
  const amountInDollars = calculateAmount(duration, isPackage);
  const amountInCents = Math.round(amountInDollars * 100);

  try {
    // Create the Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: amountInCents,
          product_data: {
            name: `${duration}-Minute ${isPackage ? 'Lesson Package' : 'Music Lesson'}`,
            description: isPackage ? '4 Lesson Package' : 'Single Lesson'
          },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:3000/success.html',
      cancel_url: `http://localhost:3000/cancel.html?session_id={CHECKOUT_SESSION_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    });

    // Create a temporary ID that we can use to track this booking
    const paymentIntentId = `temp_${session.id}`;
    console.log('Creating booking with temporary ID:', paymentIntentId);

    // Create the booking record with the temporary ID
    await prisma.booking.create({
      data: {
        duration,
        isPackage,
        amount: amountInDollars,
        paymentIntentId: paymentIntentId,
        status: 'PENDING'
      }
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Checkout session creation error:', error);
    throw new PaymentError('Failed to create checkout session');
  }
}


export async function cancelCheckoutSession(sessionId: string): Promise<void> {
  try {
    // First,try to expire the session in Stripe
    
    await stripe.checkout.sessions.expire(sessionId);
    console.log('Stripe session expired:', sessionId);

    // Then update database to reflect the cancellation
   
    const result = await prisma.booking.updateMany({
      where: {
        paymentIntentId: `temp_${sessionId}`,
        status: 'PENDING'
      },
      data: {
        status: 'CANCELLED'
      }
    });

    console.log('Database update result:', result);

    // If no booking was updated, something went wrong
    if (result.count === 0) {
      throw new PaymentError('No pending booking found for this session');
    }

    console.log('Booking marked as cancelled:', result);
  } catch (error) {
    console.error('Failed to cancel checkout session:', error);
    
    throw new PaymentError(
      error instanceof Error 
        ? `Failed to cancel checkout session: ${error.message}`
        : 'Failed to cancel checkout session'
    );
  }
}

// Function to handle webhook events from Stripe
export async function handleStripeWebhook(event: StripeWebhookEvent): Promise<void> {
  const { type, data } = event;
  console.log('Received webhook event:', type); 
  try {
    switch (type) {
      case 'checkout.session.completed': {
        // Cast the data to the correct type for TypeScript
        const session = data.object as CheckoutSessionEvent['data']['object'];
        if (session.payment_intent) {
          // Update the booking with the real payment intent ID
          await prisma.booking.updateMany({
            where: { 
              paymentIntentId: `temp_${session.id}`,
              status: 'PENDING'
            },
            data: { 
              paymentIntentId: session.payment_intent,
              status: 'COMPLETED'
            }
          });
        }
        break;
      }

      case 'checkout.session.expired': {
        // Handle abandoned checkouts
        console.log('Processing expired session:', data.object);
        const session = data.object as CheckoutSessionEvent['data']['object'];
        await prisma.booking.updateMany({
          where: {
            paymentIntentId: `temp_${session.id}`,
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED'
          }
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = data.object as PaymentIntentEvent['data']['object'];
        // Update the booking status to failed
        await prisma.booking.update({
          where: { paymentIntentId: paymentIntent.id },
          data: { status: 'FAILED' }
        });
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error processing webhook: ${error.message}`);
    }
    throw new PaymentError('Failed to process webhook event');
  }
}