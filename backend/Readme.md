# Pollify Backend API

A scalable real-time polling and survey backend built with Node.js, Express.js, MongoDB, and Socket.IO.

This backend powers a modern polling platform with:

* JWT Authentication
* Refresh Token Flow
* Real-time Poll Updates
* Poll Analytics
* Anonymous & Authenticated Responses
* CSV Export
* Poll Embedding
* Rate Limiting
* Secure Cookie Authentication
* MongoDB Transactions
* Dashboard Statistics

---

# Features

## Authentication System

* Access Token + Refresh Token architecture
* Secure httpOnly cookies
* Token revocation with blocklisting
* JWT authentication middleware
* Protected & optional-auth routes
* Profile management
* Persistent login sessions

---

## Poll Management

* Create polls with multiple questions
* Up to 20 questions per poll
* Up to 10 options per question
* Anonymous or authenticated polls
* Expiry-based polls
* Duplicate existing polls
* Publish results manually
* Close polls instantly
* Poll embedding support

---

## Response System

* Anonymous submissions
* Authenticated submissions
* Duplicate submission prevention
* IP-based duplicate protection
* Mandatory question validation
* Completion time tracking
* Atomic response submission using MongoDB transactions

---

## Real-Time Features

Using Socket.IO:

* Live response updates
* Analytics updates
* Creator notification rooms
* Poll admin rooms
* Milestone notifications
* Real-time poll status changes

---

## Analytics System

Advanced analytics powered by MongoDB Aggregation Pipelines:

* Response counts
* Participation trends
* Completion rate
* Engagement score
* Daily participation graph
* Average completion time
* Anonymous vs authenticated breakdown
* Recent responses tracking
* Question-wise statistics

---

# Tech Stack

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO

## Authentication & Security

* JWT
* bcryptjs
* cookie-parser
* helmet
* express-rate-limit
* nanoid

## Validation

* Zod
* express-validator

---

# Project Structure

```bash
src/
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── pollController.js
│   └── responseController.js
│
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
│
├── models/
│   ├── User.js
│   ├── Poll.js
│   ├── Response.js
│   └── BlacklistedToken.js
│
├── routes/
│   ├── auth.js
│   ├── polls.js
│   └── responses.js
│
├── services/
│   └── pollService.js
│
├── utils/
│   └── milestones.js
│
├── validators/
│   └── pollValidator.js
│
server.js
```

---

# Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000

MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/pollify?retryWrites=true&w=majority

JWT_SECRET=YOUR_SECRET_KEY
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET

CLIENT_URL=https://your-frontend.vercel.app

NODE_ENV=production
```

Example env configuration from your project: 

---

# Installation

## Clone Repository

```bash
git clone <your-repo-url>
cd pollify-backend
```

---

## Install Dependencies

```bash
npm install
```

---

## Run Development Server

```bash
npm run dev
```

---

## Run Production Server

```bash
npm start
```

---

# API Routes

## Auth Routes

| Method | Route                | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register user        |
| POST   | `/api/auth/login`    | Login user           |
| POST   | `/api/auth/refresh`  | Refresh access token |
| POST   | `/api/auth/logout`   | Logout user          |
| GET    | `/api/auth/me`       | Get current user     |
| PATCH  | `/api/auth/profile`  | Update profile       |

Auth routes implementation: 

---

## Poll Routes

| Method | Route                         | Description       |
| ------ | ----------------------------- | ----------------- |
| GET    | `/api/polls/my`               | Get my polls      |
| GET    | `/api/polls/dashboard`        | Dashboard stats   |
| GET    | `/api/polls/share/:shareCode` | Public poll route |
| POST   | `/api/polls`                  | Create poll       |
| GET    | `/api/polls/:id`              | Get poll by ID    |
| PATCH  | `/api/polls/:id`              | Update poll       |
| DELETE | `/api/polls/:id`              | Delete poll       |
| GET    | `/api/polls/:id/analytics`    | Poll analytics    |
| POST   | `/api/polls/:id/publish`      | Publish results   |
| POST   | `/api/polls/:id/close`        | Close poll        |
| POST   | `/api/polls/:id/duplicate`    | Duplicate poll    |
| GET    | `/api/polls/:id/export-csv`   | Export responses  |
| GET    | `/api/polls/:id/embed`        | Get embed code    |

Poll routes: 

---

## Response Routes

| Method | Route                              | Description        |
| ------ | ---------------------------------- | ------------------ |
| POST   | `/api/responses/:shareCode/submit` | Submit response    |
| GET    | `/api/responses/my`                | Get user responses |

Response routes: 

---

# Real-Time Events

## Socket Rooms

| Room                     | Purpose               |
| ------------------------ | --------------------- |
| `poll:{shareCode}`       | Public poll room      |
| `creator:{userId}`       | Creator notifications |
| `poll:admin:{shareCode}` | Admin analytics room  |

Socket setup implementation: 

---

## Events

| Event               | Description            |
| ------------------- | ---------------------- |
| `response:new`      | New response submitted |
| `poll:published`    | Poll results published |
| `poll:expired`      | Poll expired           |
| `milestone:reached` | Response milestone hit |

---

# Security Features

* Helmet security headers
* CORS whitelist support
* Rate limiting
* Secure cookies
* JWT verification
* Token revocation system
* Input validation
* MongoDB schema validation
* Duplicate submission prevention

Security middleware setup: 

---

# MongoDB Transactions

The backend uses MongoDB transactions for atomic response submissions.

Features include:

* Atomic writes
* Consistent analytics
* Safe concurrent submissions
* Automatic fallback for standalone MongoDB deployments

Transaction service implementation: 

---

# Analytics Engine

The analytics system uses advanced MongoDB aggregation pipelines with `$facet`.

Metrics include:

* Total responses
* Daily participation
* Completion rate
* Engagement score
* Average completion time
* Question statistics
* Recent responses

Analytics service: 

---

# Deployment

## Recommended Platforms

### Backend

* Railway
* Render
* Heroku

### Database

* MongoDB Atlas

### Frontend

* Vercel

---

# Important Production Notes

## Cookies

For production:

```js
secure: true
sameSite: 'none'
```

This is already configured in your auth controller.

---

## MongoDB Replica Set

Transactions require a MongoDB replica set.

Recommended:

* Use MongoDB Atlas

Your backend already includes fallback logic for standalone MongoDB deployments. 

---

# Health Check Endpoint

```http
GET /api/health
```

Returns:

```json
{
  "success": true,
  "message": "Pollify API is running"
}
```

Health route implementation: 

---

# Future Improvements

* OAuth Authentication
* Email Notifications
* Scheduled Poll Publishing
* Poll Templates
* Multi-language Support
* Webhook Integrations
* AI-based Poll Insights
* Redis Caching
* Web Push Notifications

---

# Author

Built with ❤️ using:

* Node.js
* Express.js
* MongoDB
* Socket.IO
