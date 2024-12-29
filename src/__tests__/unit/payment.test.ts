// src/__tests__/unit/payment.test.ts
jest.mock('../../config/stripe', () => {
  return {
    paymentIntents: {
      create: jest.fn()
    }
  };
});

import stripe from '../../config/stripe';
import { createPaymentIntent } from '../../services/payment';
import { calculateAmount } from '../../utils/pricing';
import { createMockStripePaymentIntent } from '../mocks/stripeMock';

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a payment intent for a single lesson', async () => {
    const mockPaymentIntent = createMockStripePaymentIntent(3000);
    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

    const paymentIntent = await createPaymentIntent(30, false);

    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 3000,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true
      }
    });

    expect(paymentIntent).toEqual({
      clientSecret: mockPaymentIntent.client_secret,
      amount: 30
    });
  });

  it('should create a payment intent for a lesson package', async () => {
    const mockPaymentIntent = createMockStripePaymentIntent(11000);
    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

    const paymentIntent = await createPaymentIntent(30, true);

    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 11000,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true
      }
    });
  });

  it('should handle Stripe API errors gracefully', async () => {
    (stripe.paymentIntents.create as jest.Mock).mockRejectedValue(
      new Error('Stripe API error')
    );

    await expect(createPaymentIntent(30, false)).rejects.toThrow('Failed to create payment intent');
  });

  it('should throw an error for invalid duration', async () => {
    await expect(createPaymentIntent(20, false)).rejects.toThrow('Invalid lesson duration');
  });
});

// describe('Payment Service', () => {
//   beforeEach(() => {
//     mockCreate.mockReset();
//     //(stripe.paymentIntents.create as jest.Mock).mockReset(); //this line caused an error
//   });

//   it('should create a payment intent for a single lesson', async () => {
//     // Use our helper to create a consistent mock payment intent
//     // For a 30-minute lesson, the amount should be 3000 cents ($30.00)
//     const mockPaymentIntent = createMockStripePaymentIntent(3000);
   
    
//     mockCreate.mockResolvedValue(mockPaymentIntent);

//     const paymentIntent = await createPaymentIntent(30, false);

//     // Check if Stripe was called with correct amount for single lesson
//     expect(mockCreate).toHaveBeenCalledWith({
//       amount: 3000, // $30.00 in cents
//       currency: 'usd',
//       automatic_payment_methods: {
//         enabled: true
//       }
//     });

//     expect(paymentIntent).toEqual({
//       clientSecret: mockPaymentIntent.client_secret,
//       amount: 30
//     });
//   });

//   it('should create a payment intent for a lesson package', async () => {
//     // For a 30-minute lesson package, the amount should be 11000 cents ($110.00)
//     const mockPaymentIntent = createMockStripePaymentIntent(11000);
    
//     mockCreate.mockResolvedValue(mockPaymentIntent);

//     const paymentIntent = await createPaymentIntent(30, true);

//     // Check if Stripe was called with correct amount for package
//     expect(mockCreate).toHaveBeenCalledWith({
//       amount: 11000, // $110.00 in cents
//       currency: 'usd',
//       automatic_payment_methods: {
//         enabled: true
//       }
//     });
//   });

//   it('should handle Stripe API errors gracefully', async () => {
//     // Simulate a Stripe API error
//     mockCreate.mockRejectedValue(
//       new Error('Stripe API error')
//     );

//     await expect(createPaymentIntent(30, false)).rejects.toThrow('Failed to create payment intent');
//   });

//   it('should throw an error for invalid duration', async () => {
//     await expect(createPaymentIntent(20, false)).rejects.toThrow('Invalid lesson duration');
//   });
// });

// describe('Payment Service', () => {
//   beforeEach(() => {
//     // Clear all mocks before each test
//     jest.clearAllMocks();
//   });

//   it('should create a payment intent with correct amount', async () => {
//     // Mock Stripe's response
//     const mockPaymentIntent = {
//       id: 'pi_test_123',
//       client_secret: 'test_secret_123',
//       amount: 3000, // Amount in cents
//       currency: 'usd'
//     };
    
//     // Set up our mock to return the fake payment intent
//     (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

//     // Test creating a payment intent for a 30-minute lesson
//     const duration = 30;
//     const isPackage = false;
//     const paymentIntent = await createPaymentIntent(duration, isPackage);

//     // Verify Stripe was called with correct parameters
//     expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
//       amount: calculateAmount(duration, isPackage) * 100, // Convert to cents
//       currency: 'usd',
//       automatic_payment_methods: {
//         enabled: true
//       }
//     });

//     // Verify we get back the expected data
//     expect(paymentIntent).toEqual({
//       clientSecret: mockPaymentIntent.client_secret,
//       amount: mockPaymentIntent.amount / 100 // Convert back to dollars
//     });
//   });
// });