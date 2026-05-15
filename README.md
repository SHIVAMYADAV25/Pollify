# Pollify — Real-Time Polling & Feedback Platform

A full-stack real-time polling platform where users can create polls, share public links, collect anonymous or authenticated responses, and analyze live results through interactive dashboards.

Built for the ChaiCode Full Stack Hackathon using the MERN stack.

---

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-black)](https://socket.io)

---

# Live Demo

## Frontend

🌐 [Frontend Live URL](https://pollify-iota.vercel.app)

## Backend API

⚡ [Backend API URL](https://poll-production.up.railway.app)

---

# GitHub Repository

📦 [GitHub Repository](https://github.com/SHIVAMYADAV25/Poll)

---

# Features

## Authentication & Security

* JWT Access + Refresh Token architecture
* httpOnly secure refresh cookies
* Refresh token blocklisting
* Protected routes
* Persistent login sessions
* Automatic token refresh
* Anonymous & authenticated poll modes

---

## Poll System

* Create dynamic polls
* Single-option questions
* Mandatory / optional questions
* Poll expiry system
* Public share links
* QR code generation
* Poll embedding
* Duplicate poll support

---

## Response Collection

* Anonymous submissions
* Authenticated submissions
* Duplicate response prevention
* IP-based duplicate detection
* Completion time tracking
* Atomic MongoDB transactions

---

## Real-Time Features

Powered by Socket.IO

* Live response counts
* Real-time analytics updates
* Poll status updates
* Creator notifications
* Milestone events

---

## Analytics Dashboard

* Response statistics
* Participation insights
* Question-wise summaries
* Option distribution
* Completion tracking
* Public published results
* CSV export support

---

# Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* Framer Motion
* Zustand
* Axios
* Socket.IO
* Recharts

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* Zod
* bcryptjs
* cookie-parser
* express-rate-limit
* helmet

---

# Monorepo Structure

```bash id="u0gx1d"
pollify/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   └── server.js
│
└── README.md
```

---

# Installation

## Clone Repository

```bash id="qq2o2e"
git clone YOUR_GITHUB_REPO
cd pollify
```

---

# Backend Setup

## Navigate to Backend

```bash id="av2kkt"
cd backend
```

## Install Dependencies

```bash id="25hgrg"
npm install
```

## Configure Environment Variables

Create `.env`

```env id="dk8m0w"
PORT=5000

MONGO_URI=YOUR_MONGODB_URI

JWT_SECRET=YOUR_SECRET
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET

CLIENT_URL=http://localhost:5173

NODE_ENV=development
```

## Start Backend

```bash id="6khfdn"
npm run dev
```

Backend runs on:

```txt id="owgmzv"
http://localhost:5000
```

---

# Frontend Setup

## Navigate to Frontend

```bash id="9lmxkk"
cd frontend
```

## Install Dependencies

```bash id="j5y6c7"
npm install
```

## Configure Environment Variables

Create `.env`

```env id="7qltkt"
VITE_API_BASE=http://localhost:5000
```

## Start Frontend

```bash id="88h0yc"
npm run dev
```

Frontend runs on:

```txt id="m1m2u0"
http://localhost:5173
```

---

# API Routes

## Auth Routes

| Method | Endpoint             |
| ------ | -------------------- |
| POST   | `/api/auth/register` |
| POST   | `/api/auth/login`    |
| POST   | `/api/auth/refresh`  |
| POST   | `/api/auth/logout`   |
| GET    | `/api/auth/me`       |

---

## Poll Routes

| Method | Endpoint                      |
| ------ | ----------------------------- |
| POST   | `/api/polls`                  |
| GET    | `/api/polls/my`               |
| GET    | `/api/polls/share/:shareCode` |
| GET    | `/api/polls/:id`              |
| PATCH  | `/api/polls/:id`              |
| DELETE | `/api/polls/:id`              |
| POST   | `/api/polls/:id/publish`      |
| POST   | `/api/polls/:id/close`        |
| GET    | `/api/polls/:id/analytics`    |
| GET    | `/api/polls/:id/export-csv`   |

---

## Response Routes

| Method | Endpoint                           |
| ------ | ---------------------------------- |
| POST   | `/api/responses/:shareCode/submit` |
| GET    | `/api/responses/my`                |

---

# Real-Time Architecture

Socket rooms used:

```txt id="jklc42"
poll:{shareCode}
creator:{userId}
poll:admin:{shareCode}
```

Real-time events:

* `response:new`
* `poll:expired`
* `poll:published`
* `milestone:reached`

---

# Security Features

* Helmet security headers
* Secure cookies
* JWT verification
* Token revocation
* Request rate limiting
* Protected routes
* Input validation
* Duplicate response prevention

---

# Production Deployment

## Frontend

Deploy on:

* Vercel

## Backend

Deploy on:

* Railway
* Render

## Database

Use:

* MongoDB Atlas

---

# Hackathon Highlights

✅ Real-time polling using WebSockets
✅ JWT authentication with refresh flow
✅ Atomic MongoDB transactions
✅ Anonymous + authenticated poll support
✅ Poll expiry system
✅ Public result publishing
✅ Live analytics dashboard
✅ Optimistic UI updates
✅ Socket room isolation
✅ Production-style MERN architecture

---

# Future Improvements

* OAuth login
* AI-generated poll suggestions
* Drag-and-drop poll builder
* Dark mode
* Multi-language support
* Push notifications
* Poll templates
* Team collaboration

---

# Author

Built by Shivam Yadav for the ChaiCode Full Stack Hackathon 🚀
