// src/__tests__/unit/payment.test.ts
import stripe from '../../config/stripe';
import { createPaymentIntent } from '../../services/payment';
import { calculateAmount } from '../../utils/pricing';

// Mock the Stripe module
jest.mock('../../config/stripe', () => ({
  paymentIntents: {
    create: jest.fn()
  }
}));

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a payment intent for a single lesson', async () => {
    const mockPaymentIntent = {
      id: 'pi_test_123',
      client_secret: 'test_secret_123',
      amount: 3000,
      currency: 'usd'
    };
    
    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

    const paymentIntent = await createPaymentIntent(30, false);

    // Check if Stripe was called with correct amount for single lesson
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 3000, // $30.00 in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true
      }
    });

    expect(paymentIntent).toEqual({
      clientSecret: 'test_secret_123',
      amount: 30
    });
  });

  it('should create a payment intent for a lesson package', async () => {
    const mockPaymentIntent = {
      id: 'pi_test_456',
      client_secret: 'test_secret_456',
      amount: 11000,
      currency: 'usd'
    };
    
    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

    const paymentIntent = await createPaymentIntent(30, true);

    // Check if Stripe was called with correct amount for package
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 11000, // $110.00 in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true
      }
    });
  });

  it('should handle Stripe API errors gracefully', async () => {
    // Simulate a Stripe API error
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