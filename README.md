# SlotSwapper Backend API

Next.js API backend for SlotSwapper application with MongoDB and AI integration.

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Environment Variables
Create `.env.local` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/slotswapper?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_in_production
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Development
```bash
npm run dev
```
Server runs on http://localhost:3001

### Production Build
```bash
npm run build
npm start
```

## 📁 Project Structure

```
backend/
├── app/api/          # API routes
│   ├── auth/         # Authentication
│   ├── events/       # Event CRUD
│   ├── swap-*/       # Swap logic
│   └── ai/           # AI features
├── lib/              # Utilities
├── models/           # Mongoose models
└── package.json
```

## 🔌 API Documentation

See main README.md for complete API documentation with request/response examples.

### Quick Reference

**Authentication**
- POST `/api/auth/signup` - Register
- POST `/api/auth/login` - Login

**Events**
- GET `/api/events` - List events
- POST `/api/events` - Create event
- PUT `/api/events/[id]` - Update event
- DELETE `/api/events/[id]` - Delete event

**Swapping**
- GET `/api/swappable-slots` - Browse available slots
- POST `/api/swap-request` - Create swap request
- GET `/api/swap-requests` - View requests
- POST `/api/swap-response/[requestId]` - Accept/Reject

**AI**
- POST `/api/ai/swap-suggestions` - Get smart suggestions
- GET `/api/ai/schedule-analysis` - Analyze conflicts

## 🛠️ Tech Stack

- Next.js 16 (App Router)
- MongoDB + Mongoose
- JWT Authentication
- Groq AI (llama-3.3-70b-versatile)
- TypeScript

## 📄 License

MIT
