// src/__tests__/integration/paymentIntegration.test.ts
import { PrismaClient } from '@prisma/client';
import stripe from '../../config/stripe';
import { createPaymentIntent } from '../../services/payment';
import { calculateAmount } from '../../utils/pricing';

// Mock Stripe
jest.mock('../../config/stripe', () => ({
  paymentIntents: {
    create: jest.fn()
  }
}));


const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
});

describe('Payment Integration', () => {
  beforeAll(async () => {
    // Ensure we're using test database
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  });
  
  beforeEach(async () => {
    // Clear database before each test
    await prisma.booking.deleteMany();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.$disconnect();
  });

  it('should create a booking record when payment intent is created', async () => {
    // Arrange: Set up our mock Stripe response
    const mockPaymentIntent = {
      id: 'pi_test_123',
      client_secret: 'test_secret_123',
      amount: 3000,
      currency: 'usd'
    };
    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

   
    await createPaymentIntent(30, false);

    // Add a small delay to ensure database operation completes
    await new Promise(resolve => setTimeout(resolve, 100));


    // Assert: Check database record was created
    const booking = await prisma.booking.findFirst({
      where: {
        paymentIntentId: mockPaymentIntent.id
      }
    });

    // Verify booking record exists and has correct data
    expect(booking).toBeTruthy();
    expect(booking).toMatchObject({
      duration: 30,
      isPackage: false,
      amount: 30,
      status: 'PENDING',
      paymentIntentId: mockPaymentIntent.id
    });
  });
});