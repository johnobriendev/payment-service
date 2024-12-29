// src/__tests__/integration/webhookHandling.test.ts
import { PrismaClient } from '@prisma/client';
import { handleStripeWebhook } from '../../services/payment';
import { v4 as uuidv4 } from 'uuid';


const prisma = new PrismaClient();

describe('Webhook Handling', () => {
  beforeEach(async () => {
    await prisma.booking.deleteMany();
  });

  afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.$disconnect();
  });

  it('should update booking status when checkout session is completed', async () => {
    const sessionId = `cs_test_${uuidv4()}`;
    const paymentIntentId = `pi_test_${uuidv4()}`;
    
    // Create a booking with temporary ID
    const booking = await prisma.booking.create({
      data: {
        duration: 30,
        isPackage: false,
        amount: 30,
        paymentIntentId: `temp_${sessionId}`,
        status: 'PENDING'
      }
    });

    // Simulate checkout.session.completed webhook
    const mockWebhookEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          payment_intent: paymentIntentId,
          status: 'complete'
        }
      }
    };

    await handleStripeWebhook(mockWebhookEvent);

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

    expect(updatedBooking).toBeTruthy();
    expect(updatedBooking?.status).toBe('COMPLETED');
    expect(updatedBooking?.paymentIntentId).toBe(paymentIntentId);
  });

  it('should update booking status to FAILED when payment fails', async () => {
    const paymentIntentId = `pi_test_${uuidv4()}`;
    
    const booking = await prisma.booking.create({
      data: {
        duration: 30,
        isPackage: false,
        amount: 30,
        paymentIntentId: paymentIntentId,
        status: 'PENDING'
      }
    });

    const mockWebhookEvent = {
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: paymentIntentId,
          status: 'failed'
        }
      }
    };

    await handleStripeWebhook(mockWebhookEvent);

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

    expect(updatedBooking?.status).toBe('FAILED');
  });

  it('should handle checkout session expiration', async () => {
    const sessionId = `cs_test_${uuidv4()}`;
    
    const booking = await prisma.booking.create({
      data: {
        duration: 30,
        isPackage: false,
        amount: 30,
        paymentIntentId: `temp_${sessionId}`,
        status: 'PENDING'
      }
    });

    const mockWebhookEvent = {
      type: 'checkout.session.expired',
      data: {
        object: {
          id: sessionId,
          status: 'expired'
        }
      }
    };

    await handleStripeWebhook(mockWebhookEvent);

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

    expect(updatedBooking?.status).toBe('CANCELLED');
  });
});

// describe('Webhook Handling', () => {
//   beforeEach(async () => {
//     // Clean up and create test booking BEFORE webhook test
//     await prisma.booking.deleteMany();
    
//   });

//   afterAll(async () => {
//     await prisma.booking.deleteMany();
//     await prisma.$disconnect();
//   });

//   it('should update booking status to COMPLETED when payment succeeds', async () => {
//     // Create a unique payment intent ID for this test
//     const uniquePaymentIntentId = `pi_test_${uuidv4()}`;
    
//     // create a booking record in PENDING state
//     const booking = await prisma.booking.create({
//       data: {
//         duration: 30,
//         isPackage: false,
//         amount: 30,
//         paymentIntentId: uniquePaymentIntentId,
//         status: 'PENDING'
//       }
//     });

//     // Add a small delay to ensure the database operation completes
//     await new Promise(resolve => setTimeout(resolve, 100));

//     // Simulate Stripe sending a successful payment webhook
//     const mockWebhookEvent = {
//       type: 'payment_intent.succeeded',
//       data: {
//         object: {
//           id: uniquePaymentIntentId,
//           status: 'succeeded'
//         }
//       }
//     };

//     await handleStripeWebhook(mockWebhookEvent);

//     // Add another small delay
//     await new Promise(resolve => setTimeout(resolve, 100));

//     // Verify booking status was updated
//     const updatedBooking = await prisma.booking.findUnique({
//       where: { id: booking.id }
//     });

//     expect(updatedBooking).toBeTruthy();
//     expect(updatedBooking?.status).toBe('COMPLETED');
//   });

//   it('should update booking status to FAILED when payment fails', async () => {
//     // Create a booking record
//     const booking = await prisma.booking.create({
//       data: {
//         duration: 30,
//         isPackage: false,
//         amount: 30,
//         paymentIntentId: 'pi_test_failed',
//         status: 'PENDING'
//       }
//     });

//     // Simulate Stripe sending a failed payment webhook
//     const mockWebhookEvent = {
//       type: 'payment_intent.payment_failed',
//       data: {
//         object: {
//           id: 'pi_test_failed',
//           status: 'failed'
//         }
//       }
//     };

//     await handleStripeWebhook(mockWebhookEvent);

//     // Verify booking status was updated
//     const updatedBooking = await prisma.booking.findUnique({
//       where: { id: booking.id }
//     });

//     expect(updatedBooking?.status).toBe('FAILED');
//   });
// });