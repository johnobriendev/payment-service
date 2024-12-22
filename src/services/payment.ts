import stripe from '../config/stripe';
import { calculateAmount } from '../utils/pricing';

export interface PaymentIntentResult {
  clientSecret: string;
  amount: number;
}

export async function createPaymentIntent(
  duration: number,
  isPackage: boolean
): Promise<PaymentIntentResult> {
  // Calculate amount in dollars, then convert to cents for Stripe
  const amountInDollars = calculateAmount(duration, isPackage);
  const amountInCents = amountInDollars * 100;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true
    }
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    amount: amountInDollars
  };
}