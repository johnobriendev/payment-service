# Music Lesson Payment Service

A microservice that handles payments for music lesson bookings using Stripe Checkout. This service allows customers to book individual lessons or lesson packages with different durations.

## Features

- Process payments for single lessons and lesson packages
- Secure payment processing with Stripe Checkout
- Real-time payment status updates via webhooks
- Database tracking of booking statuses
- Handles payment cancellations and failures

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma (ORM)
- Stripe API
- Docker

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- Docker and Docker Compose
- Stripe CLI (for webhook testing)

You'll also need:
- A Stripe account (you can sign up for free)
- Stripe API keys (test keys for development)

## Setup

1. Clone the repository:
```bash
git clone 
cd payment-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/payment_db"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
```

4. Start the PostgreSQL database using Docker:
```bash
docker-compose up -d
```

5. Run Prisma migrations:
```bash
npx prisma migrate dev
```

6. Start the Stripe webhook listener in a separate terminal:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

7. Start the development server:
```bash
npm run dev
```

## Project Structure
```
payment-service/
├── src/
│   ├── config/
│   │   └── stripe.ts
│   ├── controllers/
│   │   └── paymentController.ts
│   ├── routes/
│   │   └── paymentRoutes.ts
│   ├── services/
│   │   └── payment.ts
│   ├── utils/
│   │   └── pricing.ts
│   └── app.ts
├── prisma/
│   └── schema.prisma
├── public/
│   ├── index.html
│   ├── success.html
│   └── cancel.html
├── Dockerfile
└── docker-compose.yml
```

## API Endpoints

### POST /api/payments/create-checkout
Creates a Stripe Checkout session for lesson booking.

Request body:
```json
{
  "duration": 30, // 30, 45, or 60 minutes
  "isPackage": false // true for package booking
}
```

### POST /api/payments/webhook
Handles Stripe webhook events for payment status updates.

### POST /api/payments/cancel-session
Handles cancellation of booking sessions.

Request body:
```json
{
  "sessionId": "cs_test_..." // Stripe Checkout session ID
}
```

## Testing
The project includes several test suites:
```bash
npm test
```

For development, you can use Stripe's test cards:
* Success: 4242 4242 4242 4242
* Failure: 4000 0000 0000 0002

## Database Schema
The main `Booking` model tracks all lesson bookings:

```prisma
model Booking {
  id              Int      @id @default(autoincrement())
  duration        Int
  isPackage       Boolean  @default(false)
  amount          Float
  status          String   @default("PENDING")
  paymentIntentId String   @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Contributing
1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License
MIT