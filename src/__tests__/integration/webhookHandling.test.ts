// src/__tests__/integration/webhookHandling.test.ts
import { PrismaClient } from '@prisma/client';
import { handleStripeWebhook } from '../../services/payment';

const prisma = new PrismaClient();

describe('Webhook Handling', () => {
  beforeEach(async () => {
    await prisma.booking.deleteMany();
  });

  afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.$disconnect();
  });

  it('should update booking status to COMPLETED when payment succeeds', async () => {
    // First create a booking record in PENDING state
    const booking = await prisma.booking.create({
      data: {
        duration: 30,
        isPackage: false,
        amount: 30,
        paymentIntentId: 'pi_test_success',
        status: 'PENDING'
      }
    });

    // Simulate Stripe sending a successful payment webhook
    const mockWebhookEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_success',
          status: 'succeeded'
        }
      }
    };

    await handleStripeWebhook(mockWebhookEvent);

    // Verify booking status was updated
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

    expect(updatedBooking?.status).toBe('COMPLETED');
  });

  it('should update booking status to FAILED when payment fails', async () => {
    // Create a booking record
    const booking = await prisma.booking.create({
      data: {
        duration: 30,
        isPackage: false,
        amount: 30,
        paymentIntentId: 'pi_test_failed',
        status: 'PENDING'
      }
    });

    // Simulate Stripe sending a failed payment webhook
    const mockWebhookEvent = {
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_test_failed',
          status: 'failed'
        }
      }
    };

    await handleStripeWebhook(mockWebhookEvent);

    // Verify booking status was updated
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

    expect(updatedBooking?.status).toBe('FAILED');
  });
});