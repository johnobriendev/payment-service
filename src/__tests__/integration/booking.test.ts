import { PrismaClient } from '@prisma/client';
import { calculateAmount } from '../../utils/pricing';

const prisma = new PrismaClient();

describe('Booking Integration', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await prisma.booking.deleteMany();
  });

  afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.$disconnect();
  });

  it('should create a booking with correct calculated amount', async () => {
    const duration = 30;
    const isPackage = false;
    const amount = calculateAmount(duration, isPackage);
    
    const booking = await prisma.booking.create({
      data: {
        duration,
        isPackage,
        amount,
        paymentIntentId: 'pi_test_123' // replace this with real Stripe IDs later
      }
    });

    expect(booking.duration).toBe(duration);
    expect(booking.amount).toBe(amount);
    expect(booking.status).toBe('PENDING'); // Testing default value
  });

  it('should update booking status correctly', async () => {
    const booking = await prisma.booking.create({
      data: {
        duration: 30,
        amount: 30,
        paymentIntentId: 'pi_test_456'
      }
    });

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'COMPLETED' }
    });

    expect(updatedBooking.status).toBe('COMPLETED');
  });
});