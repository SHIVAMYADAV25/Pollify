# Pollify — Real-time Polling Platform

> A production-grade, full-stack polling platform built with the MERN stack and Socket.io for live real-time updates.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-black)](https://socket.io)

---

## ✨ Features

### 🔐 Authentication & Access Control
- JWT-based authentication with secure httpOnly-style token storage
- Protected routes for creators (dashboard, analytics, poll management)
- Optional auth middleware for public poll pages
- Register / Login with full validation

### 📊 Poll Creation & Management
- Create polls with 1–20 questions, each with 2–10 options (single-choice)
- Mark individual questions as **mandatory** or **optional**
- Choose between **anonymous** or **authenticated** response mode per poll
- Set expiry via preset durations (1h / 6h / 24h / 48h / 72h / 7d) or custom datetime
- Polls auto-expire — no further responses accepted after expiry

### 📝 Response Collection
- Public share link — anyone with the link can respond (no account needed for anonymous polls)
- Authenticated mode enforces login before submission
- Duplicate prevention: one response per user (auth) / one per IP (anonymous)
- Real-time countdown timer on the poll form
- Mandatory/optional validation on both frontend and backend
- Completion time tracking

### 📈 Analytics Dashboard
- Total responses, completion rate, avg. completion time
- Question-wise summaries: option counts + percentage bars
- Pie charts per question (Recharts)
- 7-day participation trend (line chart)
- Anonymous vs authenticated breakdown
- Recent submissions feed
- **Live updates via Socket.io** — analytics refresh automatically when new responses arrive

### 🌐 Result Publishing
- Creator can manually close an active poll at any time
- After expiry/close, creator can publish final results in one click
- Published results are publicly accessible at the same `/poll/:shareCode/results` URL
- Results page shows full option counts, percentages, winner highlights, and charts
- Socket.io notifies open poll tabs when results are published

### ⚡ Real-time (WebSocket / Socket.io)
- Live response count updates on TakePollPage
- Analytics dashboard auto-refreshes on new responses
- Poll expiry broadcast to respondents
- Publish event redirects open poll tabs to results page
- Creator dashboard updates live response counts

---

## 🛠 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS        |
| Animations  | Framer Motion                       |
| Charts      | Recharts                            |
| State       | Zustand                             |
| HTTP Client | Axios                               |
| Backend     | Node.js, Express 4                  |
| Database    | MongoDB + Mongoose                  |
| Auth        | JWT (jsonwebtoken) + bcryptjs       |
| Real-time   | Socket.io v4                        |
| Validation  | express-validator (backend)         |
| Security    | helmet, cors, express-rate-limit    |

---

## 📁 Project Structure

```
pollify/                          ← monorepo root
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js             ← MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── pollController.js ← CRUD, analytics, publish, close
│   │   │   └── responseController.js
│   │   ├── middleware/
│   │   │   ├── auth.js           ← protect + optionalAuth
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Poll.js           ← questions, options, expiry, shareCode
│   │   │   └── Response.js       ← answers, respondent, IP, timing
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── polls.js
│   │   │   └── responses.js
│   │   └── server.js             ← Express + Socket.io setup
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── LoadingSpinner.jsx
    │   │   │   └── ProtectedRoute.jsx
    │   │   └── layout/
    │   │       ├── AuthLayout.jsx
    │   │       ├── Layout.jsx
    │   │       └── Navbar.jsx
    │   ├── lib/
    │   │   ├── api.js             ← Axios instance with auth interceptor
    │   │   └── socket.js          ← Socket.io client singleton
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── RegisterPage.jsx
    │   │   ├── analytics/
    │   │   │   └── AnalyticsPage.jsx  ← Live charts + Socket.io
    │   │   ├── dashboard/
    │   │   │   └── DashboardPage.jsx
    │   │   ├── polls/
    │   │   │   ├── CreatePollPage.jsx
    │   │   │   ├── MyPollsPage.jsx
    │   │   │   └── PollDetailPage.jsx
    │   │   ├── public/
    │   │   │   ├── TakePollPage.jsx   ← Public form + live count
    │   │   │   └── ResultsPage.jsx    ← Published results
    │   │   ├── HomePage.jsx
    │   │   └── NotFoundPage.jsx
    │   ├── store/
    │   │   └── authStore.js       ← Zustand auth state
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css              ← Design system + Tailwind
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/pollify.git
cd pollify
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

**Backend `.env`:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/pollify
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:5000` automatically.

### 4. Open

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Polls (creator)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/polls` | ✅ | Create poll |
| GET | `/api/polls/my` | ✅ | List creator's polls |
| GET | `/api/polls/dashboard` | ✅ | Dashboard stats |
| GET | `/api/polls/:id` | ✅ | Get poll detail |
| PATCH | `/api/polls/:id` | ✅ | Update poll |
| DELETE | `/api/polls/:id` | ✅ | Delete poll |
| POST | `/api/polls/:id/close` | ✅ | Manually close poll |
| POST | `/api/polls/:id/publish` | ✅ | Publish results |
| GET | `/api/polls/:id/analytics` | ✅ | Full analytics |

### Polls (public)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/polls/share/:shareCode` | Optional | Get poll for responding |

### Responses
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/responses/:shareCode/submit` | Optional | Submit response |
| GET | `/api/responses/my` | ✅ | My submitted responses |

---

## 📡 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join:poll` | `shareCode` | Join a poll room for updates |
| `leave:poll` | `shareCode` | Leave poll room |
| `join:creator` | `userId` | Join creator room for dashboard updates |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `response:new` | `{ totalResponses, pollId, shareCode }` | New response submitted |
| `poll:expired` | `{ pollId, shareCode }` | Poll just expired |
| `poll:published` | `{ pollId, shareCode }` | Results published |

---

## 🗄 Database Schema

### Poll
```
title, description, creator (ref: User)
shareCode (unique, nanoid 10)
questions[]: { text, isMandatory, options[]: { text, count } }
isAnonymous, status (active|expired|published)
expiresAt, totalResponses
isResultPublished, publishedAt
settings: { allowMultipleSubmissions, showProgressBar, randomizeQuestions }
```

### Response
```
poll (ref: Poll), respondent (ref: User, nullable)
isAnonymous, respondentName
answers[]: { questionId, selectedOptionId }
ipAddress, userAgent, completionTime
```

---

## 🎨 Design System

- **Primary accent:** `#c0ff2a` (Neon Green)
- **Secondary accent:** `#ff57c9` (Aurora Pink)
- **Tertiary:** `#4d9fff` (Electric Blue)
- **Background:** `#06061a` → `#0d0d28` → `#111130`
- **Typography:** DM Sans (body) + Plus Jakarta Sans (display) + JetBrains Mono (code)
- **Components:** Glass morphism cards, animated progress bars, live indicator dots

---

## 🏗 Deployment

### Backend (Render / Railway / Fly.io)
1. Set all env variables in the platform dashboard
2. Build command: `npm install`
3. Start command: `npm start`

### Frontend (Vercel / Netlify)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Set env var: `VITE_API_URL` if not using proxy in production

> **Note:** In production, update `CLIENT_URL` in backend env and configure CORS accordingly. For Vercel, add a `vercel.json` to proxy `/api` to your backend URL.

### `vercel.json` (frontend)
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-backend.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## ✅ Hackathon Criteria Coverage

| Criteria | Implementation |
|----------|---------------|
| Authentication & Access Control | JWT auth, protected routes, optional auth middleware |
| Poll Creation & Question Management | Dynamic form, 1–20 questions, mandatory/optional toggle, 2–10 options |
| Response Collection Flow | Public form, expiry enforcement, duplicate prevention, mandatory validation |
| Analytics & Feedback Dashboard | Bar/Pie/Line charts, option counts, participation trends, recent submissions |
| Frontend Experience | Framer Motion animations, responsive design, live indicators, custom design system |
| Backend Architecture & API Design | RESTful Express API, proper error handling, rate limiting, helmet security |
| Real-Time Updates (WebSockets) | Socket.io rooms: poll room + creator room, live counts, publish events |
| Code Quality & Project Structure | Separated controllers/routes/models/middleware, Zustand state management |

---

## 📝 License

MIT — built for the Pollify Hackathon.