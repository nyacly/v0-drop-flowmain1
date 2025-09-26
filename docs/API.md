# DropFlow API Documentation

Complete API reference for DropFlow backend endpoints.

## Authentication

DropFlow uses session-based authentication with secure HTTP-only cookies.

### Base URL
\`\`\`
Development: http://localhost:8000
Production: https://your-domain.com
\`\`\`

### Authentication Headers
\`\`\`http
Cookie: connect.sid=s%3A...
Content-Type: application/json
\`\`\`

---

## Authentication Endpoints

### POST /register
Register a new user account.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Registration successful",
  "userId": 123,
  "emailSent": true
}
\`\`\`

**Error Responses:**
- `400` - Validation error (weak password, invalid email)
- `409` - Email already registered

---

### POST /verify-email
Verify email address with 6-digit code.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "code": "123456"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Email verified successfully",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "isVerified": true,
    "subscriptionType": "free"
  }
}
\`\`\`

**Error Responses:**
- `400` - Invalid or expired code
- `404` - User not found

---

### POST /login
Authenticate user and create session.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com", 
  "password": "securePassword123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "isVerified": true,
    "subscriptionType": "pro_monthly"
  }
}
\`\`\`

**Error Responses:**
- `400` - Email not verified
- `401` - Invalid credentials

---

### POST /logout  
End user session.

**Response:**
\`\`\`json
{
  "message": "Logged out successfully"
}
\`\`\`

---

### GET /user
Get current user information.

**Response:**
\`\`\`json
{
  "id": 123,
  "email": "user@example.com",
  "isVerified": true,
  "subscriptionType": "pro_monthly",
  "createdAt": "2024-01-15T10:30:00Z"
}
\`\`\`

**Error Responses:**
- `401` - Not authenticated

---

## Route Optimization

### POST /optimize
Optimize delivery route with Google Maps integration.

**Request Body:**
\`\`\`json
{
  "stops": [
    {
      "id": "stop_1",
      "rawAddress": "123 Queen St, Brisbane QLD 4000",
      "customerName": "ABC Company",
      "phone": "+61 7 3000 0001",
      "notes": "Loading dock at rear",
      "timeWindow": "9:00 AM - 11:00 AM"
    }
  ],
  "currentLocation": {
    "lat": -27.4698,
    "lng": 153.0251
  },
  "plan": {
    "vehicle": {
      "type": "van",
      "lPer100": 8.5,
      "fuelPrice": 1.89
    }
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "route": {
    "orderedStops": [
      {
        "id": "stop_1",
        "rawAddress": "123 Queen St, Brisbane QLD 4000",
        "customerName": "ABC Company",
        "geo": {
          "lat": -27.4705,
          "lng": 153.0260,
          "formattedAddress": "123 Queen Street, Brisbane City QLD 4000, Australia"
        }
      }
    ],
    "totals": {
      "timeMin": 45,
      "distanceKm": 12.7,
      "fuelCost": 6.85
    },
    "etas": {
      "stop_1": "10:30 AM"
    },
    "polyline": "encoded_polyline_string",
    "decodedPolyline": [
      {"latitude": -27.4698, "longitude": 153.0251}
    ]
  }
}
\`\`\`

**Error Responses:**
- `400` - Invalid stops data
- `401` - Authentication required
- `403` - Subscription limit exceeded (free tier > 10 stops)
- `500` - Google Maps API error
- `502` - Google Maps APIs not enabled

---

## Weather Information

### GET /weather
Get weather alerts for location.

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude

**Example:**
\`\`\`
GET /weather?lat=-27.4698&lng=153.0251
\`\`\`

**Response:**
\`\`\`json
{
  "alert": "Rain expected 3-6pm"
}
\`\`\`

**Note:** Currently returns mock data. Production version would integrate with weather API.

---

## Configuration

### GET /api/config
Get public configuration for frontend.

**Response:**
\`\`\`json
{
  "googleMapsApiKey": "AIza...public_key"
}
\`\`\`

---

## Stripe Integration

### POST /api/create-subscription
Create Stripe checkout session for subscription.

**Request Body:**
\`\`\`json
{
  "plan": "monthly"
}
\`\`\`

**Response:**
\`\`\`json
{
  "sessionUrl": "https://checkout.stripe.com/pay/cs_...",
  "sessionId": "cs_test_..."
}
\`\`\`

**Error Responses:**
- `400` - Invalid subscription plan
- `500` - Stripe configuration error

---

### GET /api/checkout-session
Verify Stripe checkout session.

**Query Parameters:**
- `session_id`: Stripe session ID

**Response:**
\`\`\`json
{
  "verified": true,
  "customerId": "cus_...",
  "subscriptionId": "sub_...",
  "subscriptionType": "month",
  "status": "complete"
}
\`\`\`

---

### POST /api/create-payment-intent
Create payment intent for one-time payments.

**Request Body:**
\`\`\`json
{
  "amount": 4.99,
  "currency": "aud"
}
\`\`\`

**Response:**
\`\`\`json
{
  "clientSecret": "pi_...client_secret"
}
\`\`\`

---

### POST /api/check-subscription
Check user's subscription status.

**Request Body:**
\`\`\`json
{
  "customerId": "cus_..."
}
\`\`\`

**Response:**
\`\`\`json
{
  "hasActiveSubscription": true,
  "subscriptionType": "monthly"
}
\`\`\`

---

### POST /api/stripe-webhook
Stripe webhook endpoint for subscription events.

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Handled Events:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Health Check

### GET /health
Application health status.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

---

## Error Handling

### Standard Error Response Format
\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details if available"
}
\`\`\`

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `502` - Bad Gateway (external API error)

---

## Rate Limiting

API endpoints are protected with rate limiting:

- **Authentication endpoints**: 5 requests per minute
- **Route optimization**: 10 requests per minute
- **General endpoints**: 100 requests per hour

Rate limit headers are included in responses:
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
\`\`\`

---

## CORS Configuration

Allowed origins for cross-origin requests:
- `http://localhost:5000` (development frontend)
- `http://127.0.0.1:5000` (Replit environment)
- `http://localhost:8081` (mobile development)
- Production domains (configured via environment)

---

## Authentication Flow

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant E as Email Service
    participant D as Database

    C->>S: POST /register
    S->>D: Create user (unverified)
    S->>E: Send verification email
    S-->>C: Registration successful
    
    C->>S: POST /verify-email
    S->>D: Verify code & mark user as verified
    S->>D: Create session
    S-->>C: User object + session cookie
    
    C->>S: Authenticated requests
    Note over S: Session middleware validates cookie
    S->>D: Fetch user data
    S-->>C: Protected resource
\`\`\`

---

## Subscription Flow

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant ST as Stripe
    participant D as Database

    C->>S: POST /api/create-subscription
    S->>ST: Create checkout session
    ST-->>S: Session URL
    S-->>C: Redirect to Stripe
    
    C->>ST: Complete payment
    ST->>S: Webhook: checkout.session.completed
    S->>D: Update user subscription
    ST-->>C: Redirect to success page
    
    C->>S: GET /api/checkout-session
    S->>ST: Verify session
    S-->>C: Subscription confirmed
\`\`\`

---

For more detailed information, check the source code in `/server/index.js` and `/server/auth.ts`.
