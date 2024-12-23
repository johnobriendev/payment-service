// src/config/stripe.ts
import Stripe from 'stripe';

// Initialize Stripe with a placeholder key for now
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2024-12-18.acacia'
});

export default stripe;