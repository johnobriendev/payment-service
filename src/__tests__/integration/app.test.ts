// src/__tests__/integration/app.test.ts
import request from 'supertest';
import app from '../../app';
import { v4 as uuidv4 } from 'uuid';
import { createMockStripePaymentIntent } from '../mocks/stripeMock';



// Create our mock function before the mock definition
const mockCreate = jest.fn();

jest.mock('../../config/stripe', () => ({
  default: {
    paymentIntents: {
      create: mockCreate
    }
  }
}));


describe('Payment API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up the mock implementation in beforeEach
    mockCreate.mockImplementation(() => {
      const mockPaymentIntent = createMockStripePaymentIntent(3000);
      return Promise.resolve(mockPaymentIntent);
    });
  });

  describe('POST /api/payments/create', () => {
    it('should create a payment intent for valid input', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .send({
          duration: 30,
          isPackage: false
        })
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json');

      // If this fails, let's see what the response body contains
      if (response.status !== 200) {
        console.log('Response Body:', response.body);
        console.log('Mock calls:', mockCreate.mock.calls);
      }  

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('clientSecret');
      expect(response.body).toHaveProperty('amount');
    });

    it('should return 400 for invalid duration', async () => {
      const response = await request(app)
        .post('/api/payments/create')
        .send({
          duration: 20,
          isPackage: false
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});