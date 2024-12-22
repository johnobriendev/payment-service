import stripe from '../config/stripe';
import { calculateAmount } from '../utils/pricing';

export interface PaymentIntentResult {
  clientSecret: string;
  amount: number;
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

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
    
    if (!paymentIntent.client_secret) {
      throw new PaymentError('Missing client secret in payment intent');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      amount: amountInDollars
    };
    
  } catch (error) {
    // If the error is from our pricing calculation, throw it as is
    if (error.message === 'Invalid lesson duration') {
      throw error;
    }
    
    // Otherwise, wrap it in our PaymentError
    throw new PaymentError('Failed to create payment intent');
  }
  
}