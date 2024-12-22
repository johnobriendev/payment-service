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
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should create a payment intent with correct amount', async () => {
    // Mock Stripe's response
    const mockPaymentIntent = {
      id: 'pi_test_123',
      client_secret: 'test_secret_123',
      amount: 3000, // Amount in cents
      currency: 'usd'
    };
    
    // Set up our mock to return the fake payment intent
    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

    // Test creating a payment intent for a 30-minute lesson
    const duration = 30;
    const isPackage = false;
    const paymentIntent = await createPaymentIntent(duration, isPackage);

    // Verify Stripe was called with correct parameters
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: calculateAmount(duration, isPackage) * 100, // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Verify we get back the expected data
    expect(paymentIntent).toEqual({
      clientSecret: mockPaymentIntent.client_secret,
      amount: mockPaymentIntent.amount / 100 // Convert back to dollars
    });
  });
});