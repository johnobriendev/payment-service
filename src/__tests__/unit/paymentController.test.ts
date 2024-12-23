// src/__tests__/unit/paymentController.test.ts
import { Request, Response } from 'express';
import { createPaymentController } from '../../controllers/paymentController';
import * as paymentService from '../../services/payment';

// Mock our payment service
jest.mock('../../services/payment');

describe('Payment Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset our response mocks before each test
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
  });

  it('should successfully create a payment intent', async () => {
    // Arrange: Set up our test data
    mockRequest = {
      body: {
        duration: 30,
        isPackage: false
      }
    };

    // Mock the service to return a successful result
    const mockPaymentResult = {
      clientSecret: 'test_secret',
      amount: 30
    };
    
    (paymentService.createPaymentIntent as jest.Mock).mockResolvedValue(mockPaymentResult);

    // Act: Call our controller
    await createPaymentController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert: Check the response
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      clientSecret: 'test_secret',
      amount: 30
    });
  });

  it('should handle missing duration in request', async () => {
    // Arrange: Create a request with missing duration
    mockRequest = {
      body: {
        isPackage: false
      }
    };

    // Act: Call our controller
    await createPaymentController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert: Check error response
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Duration is required'
    });
  });

  it('should handle payment service errors', async () => {
    // Arrange: Set up request and mock service error
    mockRequest = {
      body: {
        duration: 30,
        isPackage: false
      }
    };

    (paymentService.createPaymentIntent as jest.Mock).mockRejectedValue(
      new Error('Service error')
    );

    // Act: Call our controller
    await createPaymentController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert: Check error handling
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: 'Failed to create payment'
    });
  });
});