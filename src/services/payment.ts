// src/services/payment.ts
import { PrismaClient } from '@prisma/client';
import stripe from '../config/stripe';
import { calculateAmount } from '../utils/pricing';


export interface PaymentIntentResult {
  clientSecret: string;
  amount: number;
}

interface StripeWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      status: string;
    };
  };
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

const prisma = new PrismaClient();

export async function createPaymentIntent(
  duration: number,
  isPackage: boolean
): Promise<PaymentIntentResult> {
  try{
    const amountInDollars = calculateAmount(duration, isPackage);
    const amountInCents = amountInDollars * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Create booking record in database
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
    // If the error is from our pricing calculation, throw it as is
    if (error instanceof Error && error.message === 'Invalid lesson duration') {
      throw error;
    }
    
    // Otherwise, wrap it in our PaymentError
    throw new PaymentError('Failed to create payment intent');
  }
  
}



export async function handleStripeWebhook(event: StripeWebhookEvent): Promise<void> {
  const { type, data } = event;
  const paymentIntent = data.object;

  try {
    switch (type) {
      case 'payment_intent.succeeded':
        await prisma.booking.update({
          where: { paymentIntentId: paymentIntent.id },
          data: { status: 'COMPLETED' }
        });
        break;

      case 'payment_intent.payment_failed':
        await prisma.booking.update({
          where: { paymentIntentId: paymentIntent.id },
          data: { status: 'FAILED' }
        });
        break;

      // We can add more webhook event types here as needed
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