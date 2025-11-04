# 🎯 SlotSwapper Backend API

Next.js API backend for SlotSwapper - Employee shift swap platform with MongoDB, WebSocket notifications, AI integration, and comprehensive testing.

## 📋 Table of Contents

- [Getting Started](#-getting-started)
- [Docker Setup](#-docker-setup)
- [Testing](#-testing)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)

---

## 🚀 Getting Started

### Option 1: Docker (Recommended) 🐳

The easiest way to get started with full stack development:

```bash
# From project root - Start backend + frontend + MongoDB
docker-compose up

# Backend only with MongoDB
cd backend
docker-compose -f docker-compose.dev.yml up

# Access backend API at http://localhost:3001
```

### Option 2: Manual Setup

#### Prerequisites
- Node.js 20+
- MongoDB 7+ (running locally or MongoDB Atlas)

#### Installation
```bash
npm install
```

#### Environment Variables
Create `.env` file in backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/slotswapper
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GROQ_API_KEY=your-groq-api-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Important Environment Variables:**
- `MONGODB_URI` - MongoDB connection string (local or Atlas)
- `JWT_SECRET` - Secret key for JWT token generation (use strong random string in production)
- `GROQ_API_KEY` - API key from https://console.groq.com for AI features
- `FRONTEND_URL` - Frontend URL for CORS configuration

#### Development Server
```bash
npm run dev
```
Server runs on http://localhost:3001 with Socket.IO support

#### Production Build
```bash
npm run build
npm start
```

---

## 🐳 Docker Setup

Complete Docker support for both development and production environments.

### Backend Docker Files

- **`Dockerfile`** - Production build with multi-stage optimization
- **`Dockerfile.dev`** - Development with hot reload
- **`docker-compose.yml`** - Backend + MongoDB (production)
- **`docker-compose.dev.yml`** - Backend + MongoDB (development)

### Quick Start Commands

```bash
# Development mode (hot reload enabled)
docker-compose -f docker-compose.dev.yml up

# Production mode
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Clean restart (remove volumes)
docker-compose down -v && docker-compose up
```

### Full Stack Development

From the **project root** directory:

```bash
# Start backend + frontend + MongoDB together
docker-compose up

# This starts:
# - Backend API on http://localhost:3001
# - Frontend UI on http://localhost:3000
# - MongoDB on mongodb://localhost:27017
```

### Environment Variables in Docker

Create `backend/.env` file:
```env
MONGODB_URI=mongodb://mongodb:27017/slotswapper
JWT_SECRET=your-secret-key
GROQ_API_KEY=your-groq-api-key
FRONTEND_URL=http://localhost:3000
```

**Note:** When using Docker Compose, MongoDB hostname is `mongodb` (service name), not `localhost`.

### Docker Features

✅ **Hot Reload** - Code changes reflect instantly in development mode  
✅ **Volume Mounts** - Source code mounted with cached node_modules  
✅ **MongoDB Included** - No separate database setup required  
✅ **Network Isolation** - Services communicate via Docker network  
✅ **Persistent Data** - MongoDB data persists across container restarts  

### Troubleshooting Docker

```bash
# Container won't start
docker-compose down -v
docker-compose build --no-cache
docker-compose up

# View detailed logs
docker-compose logs backend
docker-compose logs mongodb

# Access container shell
docker-compose exec backend sh

# Check running containers
docker-compose ps
```

For complete Docker documentation, see **[../DOCKER_SETUP.md](../DOCKER_SETUP.md)**.

---

## 🧪 Testing

Comprehensive test suite using Jest and MongoDB Memory Server.

### Test Infrastructure

- **Jest 30.2.0** - Testing framework with TypeScript support
- **MongoDB Memory Server** - In-memory database for isolated tests
- **ts-jest** - TypeScript preprocessor
- **Test Utilities** - Helper functions for creating test data

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts

# Run tests with verbose output
npm test -- --verbose
```

### Test Suites

#### Authentication Tests (`__tests__/api/auth.test.ts`) - 8 Tests

1. **Signup Validation**
   - ✅ Creates new user with valid credentials
   - ✅ Rejects missing email or password (400 error)
   - ✅ Rejects duplicate email registration (409 error)
   - ✅ Returns JWT token on successful signup

2. **Password Security**
   - ✅ Hashes passwords using bcrypt
   - ✅ Does not store plain text passwords

3. **Login Validation**
   - ✅ Authenticates user with correct credentials
   - ✅ Rejects invalid email or password (401 error)

#### Swap Response Tests (`__tests__/api/swap-response.test.ts`) - 2 Tests

1. **Event Ownership Exchange**
   - ✅ Swaps event ownership between users atomically
   - ✅ Updates both events' userId fields correctly
   - ✅ Changes swap request status to ACCEPTED

2. **Error Handling & Rollback**
   - ✅ Validates swap request ownership
   - ✅ Simulates rollback on transaction failure
   - ✅ Maintains data consistency

### Test Coverage

Current coverage:
- **Authentication**: 100% of critical paths
- **Swap Logic**: Core transaction and rollback scenarios
- **Models**: User, Event, SwapRequest validation

### Writing New Tests

Test utilities available in `__tests__/helpers/testUtils.ts`:

```typescript
// Create test user with JWT token
const { user, token } = await createTestUser({
  email: 'test@example.com',
  password: 'password123'
});

// Create test event
const event = await createTestEvent(user._id, {
  title: 'Test Event',
  status: 'SWAPPABLE'
});

// Generate JWT token
const token = generateToken(userId);
```

### Testing Best Practices

- ✅ Tests run in isolated MongoDB Memory Server
- ✅ Database cleared after each test
- ✅ No external dependencies required
- ✅ Fast execution (no network calls)
- ✅ No replica set (transactions simulated)

For detailed testing documentation, see **[../TESTING_AND_NOTIFICATIONS.md](../TESTING_AND_NOTIFICATIONS.md)**.

---

## 📁 Project Structure

```
backend/
├── app/
│   └── api/                    # API Routes (Next.js App Router)
│       ├── auth/
│       │   ├── login/         # POST - User login
│       │   └── signup/        # POST - User registration
│       ├── events/
│       │   ├── route.ts       # GET, POST - List/create events
│       │   └── [id]/          # GET, PUT, DELETE - Single event operations
│       ├── swap-request/      # POST - Create swap request
│       ├── swap-requests/     # GET - List user's swap requests
│       ├── swap-response/
│       │   └── [requestId]/   # POST - Accept/reject swap
│       ├── swappable-slots/   # GET - Browse available slots
│       └── ai/
│           ├── chat/          # POST - AI chat assistant
│           ├── swap-suggestions/ # POST - Smart swap recommendations
│           └── schedule-analysis/ # GET - Conflict detection
├── lib/
│   ├── mongodb.ts             # MongoDB connection with caching
│   ├── middleware.ts          # JWT authentication middleware
│   └── socket.ts              # Socket.IO server initialization
├── models/
│   ├── User.ts                # User schema with password hashing
│   ├── Event.ts               # Event schema with status enum
│   └── SwapRequest.ts         # Swap request schema
├── __tests__/                 # Test suites
│   ├── api/
│   │   ├── auth.test.ts       # Authentication tests
│   │   └── swap-response.test.ts # Swap logic tests
│   ├── helpers/
│   │   └── testUtils.ts       # Test helper functions
│   └── setup.ts               # Global test setup
├── server.ts                  # Custom server (Next.js + Socket.IO)
├── jest.config.js             # Jest configuration
├── Dockerfile                 # Production Docker image
├── Dockerfile.dev             # Development Docker image
├── docker-compose.yml         # Backend + MongoDB stack
├── docker-compose.dev.yml     # Development stack
└── package.json
```

---

## 🔌 API Documentation

### Authentication Endpoints

#### 1. User Signup
**Endpoint:** `POST /api/auth/signup`

**Description:** Register a new user account with email and password.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6547a3b2c1d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400` - Missing required fields (email, password, name)
- `409` - Email already registered

**Features:**
- Password hashed using bcrypt (10 rounds)
- JWT token generated for immediate login
- Email uniqueness validated

---

#### 2. User Login
**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate existing user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6547a3b2c1d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials

**Security:**
- Password comparison using bcrypt
- JWT token with 7-day expiration
- Token includes userId in payload

---

### Event Management Endpoints

#### 3. List All Events
**Endpoint:** `GET /api/events`

**Description:** Retrieve all events for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "events": [
    {
      "_id": "6547a3b2c1d4e5f6a7b8c9d1",
      "title": "Morning Shift",
      "startTime": "2025-11-05T08:00:00.000Z",
      "endTime": "2025-11-05T16:00:00.000Z",
      "status": "BUSY",
      "description": "Regular morning shift",
      "userId": "6547a3b2c1d4e5f6a7b8c9d0",
      "createdAt": "2025-11-04T10:00:00.000Z"
    },
    {
      "_id": "6547a3b2c1d4e5f6a7b8c9d2",
      "title": "Evening Shift",
      "startTime": "2025-11-06T16:00:00.000Z",
      "endTime": "2025-11-07T00:00:00.000Z",
      "status": "SWAPPABLE",
      "description": "Available for swap",
      "userId": "6547a3b2c1d4e5f6a7b8c9d0"
    }
  ]
}
```

**Event Status Types:**
- `BUSY` - Not available for swapping
- `SWAPPABLE` - Available for swap requests
- `SWAP_PENDING` - Currently in negotiation

**Error Responses:**
- `401` - Invalid or missing JWT token

---

#### 4. Create Event
**Endpoint:** `POST /api/events`

**Description:** Create a new calendar event/shift.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Night Shift",
  "startTime": "2025-11-08T00:00:00.000Z",
  "endTime": "2025-11-08T08:00:00.000Z",
  "status": "SWAPPABLE",
  "description": "Optional description"
}
```

**Success Response (201):**
```json
{
  "message": "Event created successfully",
  "event": {
    "_id": "6547a3b2c1d4e5f6a7b8c9d3",
    "title": "Night Shift",
    "startTime": "2025-11-08T00:00:00.000Z",
    "endTime": "2025-11-08T08:00:00.000Z",
    "status": "SWAPPABLE",
    "description": "Optional description",
    "userId": "6547a3b2c1d4e5f6a7b8c9d0",
    "createdAt": "2025-11-04T10:30:00.000Z"
  }
}
```

**Validation:**
- All fields required except description
- startTime must be before endTime
- status must be one of: BUSY, SWAPPABLE, SWAP_PENDING

**Error Responses:**
- `400` - Invalid data or validation error
- `401` - Unauthorized

---

#### 5. Update Event
**Endpoint:** `PUT /api/events/[id]`

**Description:** Update an existing event. User can only update their own events.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Updated Night Shift",
  "startTime": "2025-11-08T00:00:00.000Z",
  "endTime": "2025-11-08T08:00:00.000Z",
  "status": "BUSY",
  "description": "Updated description"
}
```

**Success Response (200):**
```json
{
  "message": "Event updated successfully",
  "event": {
    "_id": "6547a3b2c1d4e5f6a7b8c9d3",
    "title": "Updated Night Shift",
    "status": "BUSY",
    // ... updated fields
  }
}
```

**Error Responses:**
- `400` - Invalid data
- `401` - Unauthorized
- `403` - Not the event owner
- `404` - Event not found

---

#### 6. Delete Event
**Endpoint:** `DELETE /api/events/[id]`

**Description:** Delete an event. User can only delete their own events.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "message": "Event deleted successfully"
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Not the event owner
- `404` - Event not found

---

### Swap Operations

#### 7. Browse Swappable Slots
**Endpoint:** `GET /api/swappable-slots`

**Description:** Get all swappable events from other users (marketplace view).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "slots": [
    {
      "_id": "6547a3b2c1d4e5f6a7b8c9d4",
      "title": "Morning Shift",
      "startTime": "2025-11-10T08:00:00.000Z",
      "endTime": "2025-11-10T16:00:00.000Z",
      "status": "SWAPPABLE",
      "userId": {
        "_id": "6547a3b2c1d4e5f6a7b8c9d5",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  ]
}
```

**Features:**
- Excludes current user's events
- Only shows SWAPPABLE status events
- Populates user information
- Sorted by start time

---

#### 8. Get Swap Requests
**Endpoint:** `GET /api/swap-requests`

**Description:** Get all swap requests involving the authenticated user (incoming and outgoing).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "swapRequests": [
    {
      "_id": "6547a3b2c1d4e5f6a7b8c9d6",
      "status": "PENDING",
      "createdAt": "2025-11-04T12:00:00.000Z",
      "requesterId": {
        "_id": "6547a3b2c1d4e5f6a7b8c9d0",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "requesterSlotId": {
        "_id": "6547a3b2c1d4e5f6a7b8c9d1",
        "title": "Morning Shift",
        "startTime": "2025-11-05T08:00:00.000Z",
        "endTime": "2025-11-05T16:00:00.000Z"
      },
      "targetUserId": {
        "_id": "6547a3b2c1d4e5f6a7b8c9d5",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "targetSlotId": {
        "_id": "6547a3b2c1d4e5f6a7b8c9d4",
        "title": "Evening Shift",
        "startTime": "2025-11-06T16:00:00.000Z",
        "endTime": "2025-11-07T00:00:00.000Z"
      }
    }
  ]
}
```

**Swap Request Status:**
- `PENDING` - Awaiting response
- `ACCEPTED` - Swap completed
- `REJECTED` - Swap declined

**Use Cases:**
- **Incoming Requests**: Where user is targetUserId (someone wants your shift)
- **Outgoing Requests**: Where user is requesterId (you want someone's shift)

---

#### 9. Create Swap Request
**Endpoint:** `POST /api/swap-request`

**Description:** Create a new swap request offering your shift for another user's shift.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "requesterSlotId": "6547a3b2c1d4e5f6a7b8c9d1",
  "targetSlotId": "6547a3b2c1d4e5f6a7b8c9d4"
}
```

**Success Response (201):**
```json
{
  "message": "Swap request created successfully",
  "swapRequest": {
    "_id": "6547a3b2c1d4e5f6a7b8c9d6",
    "requesterId": "6547a3b2c1d4e5f6a7b8c9d0",
    "requesterSlotId": "6547a3b2c1d4e5f6a7b8c9d1",
    "targetUserId": "6547a3b2c1d4e5f6a7b8c9d5",
    "targetSlotId": "6547a3b2c1d4e5f6a7b8c9d4",
    "status": "PENDING",
    "createdAt": "2025-11-04T12:00:00.000Z"
  }
}
```

**Transaction Steps:**
1. Validates both slots exist and are SWAPPABLE
2. Sets both slots to SWAP_PENDING
3. Creates swap request record
4. Sends real-time WebSocket notification to target user
5. Commits or rolls back atomically

**Validation:**
- Requester must own requesterSlotId
- Target must own targetSlotId
- Both slots must have SWAPPABLE status
- Cannot swap with yourself

**Error Responses:**
- `400` - Invalid slot IDs or validation error
- `401` - Unauthorized
- `403` - You don't own the requester slot
- `409` - Slots not in swappable state

**WebSocket Notification:**
- Emits `swap-request-created` event to target user
- Target user receives toast notification in real-time

---

#### 10. Accept/Reject Swap Request
**Endpoint:** `POST /api/swap-response/[requestId]`

**Description:** Accept or reject a pending swap request. Only the target user can respond.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "action": "accept"  // or "reject"
}
```

**Success Response (200):**

**For Accept:**
```json
{
  "message": "Swap request accepted successfully",
  "swapRequest": {
    "_id": "6547a3b2c1d4e5f6a7b8c9d6",
    "status": "ACCEPTED",
    "updatedAt": "2025-11-04T12:30:00.000Z"
  },
  "updatedEvents": [
    {
      "_id": "6547a3b2c1d4e5f6a7b8c9d1",
      "userId": "6547a3b2c1d4e5f6a7b8c9d5",  // Now owned by target user
      "status": "BUSY"
    },
    {
      "_id": "6547a3b2c1d4e5f6a7b8c9d4",
      "userId": "6547a3b2c1d4e5f6a7b8c9d0",  // Now owned by requester
      "status": "BUSY"
    }
  ]
}
```

**For Reject:**
```json
{
  "message": "Swap request rejected",
  "swapRequest": {
    "_id": "6547a3b2c1d4e5f6a7b8c9d6",
    "status": "REJECTED"
  },
  "updatedEvents": [
    {
      "_id": "6547a3b2c1d4e5f6a7b8c9d1",
      "status": "SWAPPABLE"  // Returned to swappable
    },
    {
      "_id": "6547a3b2c1d4e5f6a7b8c9d4",
      "status": "SWAPPABLE"  // Returned to swappable
    }
  ]
}
```

**Accept Transaction Steps:**
1. Validates swap request exists and is PENDING
2. Validates user is the target (recipient)
3. **Swaps event ownership atomically:**
   - Requester's event → Target user
   - Target's event → Requester
4. Sets both events to BUSY status
5. Updates swap request to ACCEPTED
6. Sends WebSocket notification to requester
7. Commits all changes or rolls back

**Reject Transaction Steps:**
1. Validates swap request and user
2. Returns both events to SWAPPABLE status
3. Updates swap request to REJECTED
4. Sends WebSocket notification to requester
5. Commits changes

**Validation:**
- Only target user can accept/reject
- Request must be PENDING
- Action must be "accept" or "reject"

**Error Responses:**
- `400` - Invalid action or missing fields
- `401` - Unauthorized
- `403` - Not authorized to respond to this request
- `404` - Swap request not found
- `409` - Request already processed

**WebSocket Notifications:**
- Emits `swap-request-accepted` or `swap-request-rejected`
- Requester receives real-time notification
- UI auto-refreshes to show updated events

---

### AI-Powered Features

#### 11. AI Chat Assistant
**Endpoint:** `POST /api/ai/chat`

**Description:** Interactive AI chatbot for platform guidance and support.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "message": "How do I swap my shift with another employee?"
}
```

**Success Response (200):**
```json
{
  "response": "To swap your shift, follow these steps:\n1. Mark your shift as 'Swappable' in your events\n2. Browse available shifts in the marketplace\n3. Select a shift you want and create a swap request\n4. Wait for the other user to accept\n5. Once accepted, shifts are automatically exchanged!"
}
```

**Features:**
- Powered by Groq LLM (llama-3.3-70b-versatile)
- Context-aware responses about platform features
- Helps with troubleshooting and guidance

**Error Responses:**
- `400` - Missing message
- `401` - Unauthorized
- `500` - AI service error

---

#### 12. Smart Swap Suggestions
**Endpoint:** `POST /api/ai/swap-suggestions`

**Description:** Get AI-powered swap recommendations based on your schedule patterns.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "userSlotId": "6547a3b2c1d4e5f6a7b8c9d1"
}
```

**Success Response (200):**
```json
{
  "suggestions": [
    {
      "slotId": "6547a3b2c1d4e5f6a7b8c9d7",
      "title": "Evening Shift",
      "startTime": "2025-11-05T16:00:00.000Z",
      "endTime": "2025-11-06T00:00:00.000Z",
      "ownerName": "Jane Smith",
      "compatibilityScore": 95,
      "reason": "Same duration (8 hours), adjacent time slot, similar weekday pattern"
    },
    {
      "slotId": "6547a3b2c1d4e5f6a7b8c9d8",
      "title": "Morning Shift",
      "startTime": "2025-11-06T08:00:00.000Z",
      "endTime": "2025-11-06T16:00:00.000Z",
      "ownerName": "Bob Johnson",
      "compatibilityScore": 87,
      "reason": "Same duration, one day later, good work-life balance"
    }
  ]
}
```

**AI Analysis Factors:**
- Time slot duration matching
- Day of week patterns
- Time of day preferences
- Historical swap success rates
- Work-life balance considerations

---

#### 13. Schedule Conflict Analysis
**Endpoint:** `GET /api/ai/schedule-analysis`

**Description:** AI analyzes your schedule for potential conflicts and issues.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "analysis": {
    "conflictsFound": 2,
    "warnings": [
      {
        "type": "OVERLAP",
        "severity": "HIGH",
        "message": "Events 'Morning Shift' and 'Team Meeting' overlap by 2 hours",
        "eventIds": ["6547a3b2c1d4e5f6a7b8c9d1", "6547a3b2c1d4e5f6a7b8c9d9"]
      },
      {
        "type": "BACK_TO_BACK",
        "severity": "MEDIUM",
        "message": "No break between 'Evening Shift' and 'Night Shift' (16 hours continuous)",
        "eventIds": ["6547a3b2c1d4e5f6a7b8c9d2", "6547a3b2c1d4e5f6a7b8c9d3"]
      }
    ],
    "recommendations": [
      "Consider swapping one of the overlapping shifts",
      "Add a break between back-to-back shifts for better work-life balance"
    ]
  }
}
```

**Conflict Types Detected:**
- `OVERLAP` - Time conflicts between events
- `BACK_TO_BACK` - No rest between shifts
- `OVERWORK` - Too many hours in a week
- `IRREGULAR` - Inconsistent patterns

---

### WebSocket Events (Real-time Notifications)

#### Connection
**Endpoint:** WebSocket connection at backend URL

**Client Connection:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

**Authentication:**
- JWT token sent in handshake
- User joined to room: `user:${userId}`

#### Events

**1. swap-request-created**
```javascript
socket.on('swap-request-created', (data) => {
  // Received when someone requests your shift
  console.log(data.swapRequest);
  // Show notification: "John Doe wants to swap shifts with you"
});
```

**2. swap-request-accepted**
```javascript
socket.on('swap-request-accepted', (data) => {
  // Received when your swap request is accepted
  console.log(data.swapRequest);
  // Show notification: "Jane Smith accepted your swap request!"
});
```

**3. swap-request-rejected**
```javascript
socket.on('swap-request-rejected', (data) => {
  // Received when your swap request is declined
  console.log(data.swapRequest);
  // Show notification: "Jane Smith declined your swap request"
});
```

---

## 🛠️ Tech Stack

### Core Technologies
- **Next.js 16** - React framework with App Router and API routes
- **TypeScript** - Type-safe development
- **Node.js 20+** - Runtime environment

### Database
- **MongoDB 7** - NoSQL database
- **Mongoose** - ODM with schema validation
- **MongoDB Transactions** - Atomic swap operations

### Authentication & Security
- **JWT** (jsonwebtoken) - Stateless authentication
- **bcryptjs** - Password hashing (10 rounds)
- **Middleware** - Route protection and token validation

### Real-time Communication
- **Socket.IO 4.x** - WebSocket server
- **JWT WebSocket Auth** - Secure socket connections
- **Room-based Messaging** - Targeted notifications

### AI Integration
- **Groq SDK** - AI API client
- **llama-3.3-70b-versatile** - LLM model for chat and suggestions

### Testing
- **Jest 30.2.0** - Testing framework
- **ts-jest** - TypeScript preprocessor
- **MongoDB Memory Server** - In-memory test database
- **Supertest** - HTTP assertions (installed)

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **tsx** - TypeScript execution for custom server

### Development Tools
- **ESLint** - Code linting
- **Tailwind CSS** - Utility-first CSS (PostCSS)

---

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Protected Routes** - Middleware validation
- ✅ **WebSocket Auth** - JWT validation for socket connections
- ✅ **CORS Configuration** - Controlled origin access
- ✅ **Environment Variables** - Sensitive data protection
- ✅ **Field Exclusion** - Password field hidden by default in queries
- ✅ **Input Validation** - Mongoose schema validation

---

## 📊 Database Models

### User Model
```typescript
{
  name: string,              // User's full name
  email: string,             // Unique email (index)
  password: string,          // Bcrypt hashed (hidden by default)
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-updated
}
```

### Event Model
```typescript
{
  title: string,             // Event/shift name
  startTime: Date,           // Start datetime
  endTime: Date,             // End datetime
  status: enum,              // 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING'
  userId: ObjectId,          // Reference to User (indexed)
  description?: string,      // Optional details
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` - Fast queries for user's events
- Compound index for efficient swap queries

### SwapRequest Model
```typescript
{
  requesterId: ObjectId,      // User initiating swap (ref: User)
  requesterSlotId: ObjectId,  // Event being offered (ref: Event)
  targetUserId: ObjectId,     // User receiving request (ref: User)
  targetSlotId: ObjectId,     // Event being requested (ref: Event)
  status: enum,               // 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `requesterId` - Find outgoing requests
- `targetUserId` - Find incoming requests
- Compound indexes for efficient filtering

---

## 🚀 Deployment

### Docker Deployment (Recommended)

```bash
# Build production image
docker build -t slotswapper-backend .

# Run with environment variables
docker run -p 3001:3001 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="your-secret" \
  -e GROQ_API_KEY="your-key" \
  slotswapper-backend

# Or use Docker Compose
docker-compose -f docker-compose.yml up -d
```

### Manual Deployment

**Railway / Render / Heroku:**
```bash
# Build
npm run build

# Start
npm start
```

**Environment Variables Required:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Strong random string (32+ characters)
- `GROQ_API_KEY` - Groq API key
- `FRONTEND_URL` - Frontend domain for CORS
- `NODE_ENV=production`

### Production Checklist

- [ ] Set strong JWT_SECRET (use `openssl rand -base64 32`)
- [ ] Use MongoDB Atlas (not local MongoDB)
- [ ] Enable MongoDB connection string encryption
- [ ] Configure CORS origins properly
- [ ] Set up SSL/TLS certificates
- [ ] Enable MongoDB authentication
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up automated backups
- [ ] Use environment secrets (not .env files)

---

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed:**
```bash
# Check connection string format
# mongodb://localhost:27017/slotswapper (local)
# mongodb+srv://user:pass@cluster.mongodb.net/slotswapper (Atlas)

# Verify MongoDB is running (local)
docker-compose ps mongodb
```

**JWT Token Invalid:**
```bash
# Check JWT_SECRET matches between signup and login
# Verify token format: "Bearer <token>"
# Check token expiration (default 7 days)
```

**Tests Failing:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose

# Check MongoDB Memory Server installation
npm list mongodb-memory-server
```

**WebSocket Not Connecting:**
```bash
# Verify Socket.IO server initialized in server.ts
# Check JWT token in socket auth
# Verify CORS settings allow WebSocket upgrade
```

**Port Already in Use:**
```powershell
# Check what's using port 3001
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F

# Or change port in server.ts
```

**Docker Build Fails:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t slotswapper-backend .
```

---

## 📚 Additional Documentation

- **[Main README](../README.md)** - Full project documentation
- **[Docker Setup Guide](../DOCKER_SETUP.md)** - Complete Docker documentation
- **[Testing & Notifications](../TESTING_AND_NOTIFICATIONS.md)** - Testing and WebSocket guide

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Submit pull request

---

## 📝 API Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/signup` | POST | No | Register new user |
| `/api/auth/login` | POST | No | User login |
| `/api/events` | GET | Yes | List user's events |
| `/api/events` | POST | Yes | Create event |
| `/api/events/[id]` | PUT | Yes | Update event |
| `/api/events/[id]` | DELETE | Yes | Delete event |
| `/api/swappable-slots` | GET | Yes | Browse marketplace |
| `/api/swap-requests` | GET | Yes | List swap requests |
| `/api/swap-request` | POST | Yes | Create swap request |
| `/api/swap-response/[id]` | POST | Yes | Accept/reject swap |
| `/api/ai/chat` | POST | Yes | AI chat assistant |
| `/api/ai/swap-suggestions` | POST | Yes | AI recommendations |
| `/api/ai/schedule-analysis` | GET | Yes | Conflict detection |

---

## 📄 License

MIT

---

**Built with ❤️ for ServiceHive**

For detailed information, see the [main documentation](../README.md).
