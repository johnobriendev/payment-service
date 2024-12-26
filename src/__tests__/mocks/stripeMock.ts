// src/__tests__/mocks/stripeMock.ts
import { v4 as uuidv4 } from 'uuid';

/*
 * Creates a standardized mock Stripe PaymentIntent object.
 * This helper ensures consistency across all our tests and reduces duplicate code.
 * 
 * @param amount - The payment amount in cents (defaults to 3000 cents = $30.00)
 * @returns A mock PaymentIntent object that matches Stripe's structure
 */
export const createMockStripePaymentIntent = (amount: number = 3000) => ({
  id: `pi_test_${uuidv4()}`,         // Prefix with pi_test_ to match Stripe's format
  client_secret: `test_secret_${uuidv4()}`,  // Each secret should be unique
  amount,                            // The payment amount in cents
  currency: 'usd',                   // We're standardizing on USD for our tests
  status: 'succeeded'                // Default status for most test cases
});

// /**
//  * Standard mock setup for the Stripe module.
//  * This should be imported and used at the top of any test file that needs to mock Stripe.
//  */
// export const stripeMockConfig = {
//   default: {
//     paymentIntents: {
//       create: jest.fn()
//     }
//   }
// };