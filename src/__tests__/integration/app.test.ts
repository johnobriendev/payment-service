// src/__tests__/integration/app.test.ts
jest.mock('../../config/stripe', () => {
  return {
    paymentIntents: {
      create: jest.fn()
    }
  };
});

import request from 'supertest';
import app from '../../app';
import { createMockStripePaymentIntent } from '../mocks/stripeMock';
import stripe from '../../config/stripe';

describe('Payment API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock implementation in beforeEach
    (stripe.paymentIntents.create as jest.Mock).mockImplementation(() => {
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
      expect(response.body.error).toBe('Invalid duration. Must be 30, 45, or 60 minutes');
    });
  });
});
// import request from 'supertest';
// import app from '../../app';
// import { v4 as uuidv4 } from 'uuid';
// import { createMockStripePaymentIntent } from '../mocks/stripeMock';



// // First declare the mock function
// const mockCreate = jest.fn();

// // Then use it in the mock
// jest.mock('../../config/stripe', () => ({
//   paymentIntents: {
//     create: mockCreate
//   }
// }));



// describe('Payment API Endpoints', () => {
//   beforeEach(() => {
//     mockCreate.mockReset();
//     // Set up the mock implementation in beforeEach
//     mockCreate.mockImplementation(() => {
//       const mockPaymentIntent = createMockStripePaymentIntent(3000);
//       return Promise.resolve(mockPaymentIntent);
//     });
//   });

//   describe('POST /api/payments/create', () => {
//     it('should create a payment intent for valid input', async () => {
//       const response = await request(app)
//         .post('/api/payments/create')
//         .send({
//           duration: 30,
//           isPackage: false
//         })
//         .set('Accept', 'application/json')
//         .set('Content-Type', 'application/json');


//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('success', true);
//       expect(response.body).toHaveProperty('clientSecret');
//       expect(response.body).toHaveProperty('amount');
//     });

//     it('should return 400 for invalid duration', async () => {
//       const response = await request(app)
//         .post('/api/payments/create')
//         .send({
//           duration: 20,
//           isPackage: false
//         });

//       expect(response.status).toBe(400);
//       expect(response.body).toHaveProperty('success', false);
//       expect(response.body).toHaveProperty('error');
//     });
//   });
// });