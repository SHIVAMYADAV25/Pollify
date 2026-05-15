# Pollify Frontend

A modern real-time polling frontend built with React, Vite, Tailwind CSS, and Socket.IO.

Pollify allows users to:

* Create polls in minutes
* Share polls instantly
* Collect anonymous or authenticated responses
* Watch live analytics update in real-time
* Publish public results
* Export response data
* Generate QR codes & embed polls

---

# Features

## Authentication

* Login & registration flows
* JWT authentication
* Secure refresh token system
* Protected routes
* Persistent sessions
* Automatic token refresh
* Logout handling

Auth flow implementation: 

---

## Poll Management

* Create custom polls
* Poll templates
* Duplicate polls
* Poll expiration settings
* Public share links
* QR code generation
* Embed code generation
* CSV export support

Create poll implementation: 

---

## Real-Time Features

Powered by Socket.IO:

* Live response counters
* Real-time analytics updates
* Poll status updates
* Milestone notifications
* Instant dashboard refresh

Socket implementation: 

---

## Analytics Dashboard

Interactive analytics with:

* Response trends
* Engagement score
* Completion rate
* Pie charts
* Live activity
* Recent responses
* Participation tracking

Analytics page implementation: 

---

# Tech Stack

## Core

* React
* Vite
* React Router

## Styling & UI

* Tailwind CSS
* Framer Motion
* Lucide

## State & Data

* Zustand
* Axios
* Socket.IO

## Charts & Utilities

* Recharts
* date-fns
* React Hot Toast

---

# Folder Structure

```bash id="c5tuk7"
src/
├── components/
│   ├── common/
│   │   ├── ConfirmDialog.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── QRCode.jsx
│   │
│   └── layout/
│       ├── AuthLayout.jsx
│       ├── Layout.jsx
│       └── Navbar.jsx
│
├── lib/
│   ├── api.js
│   └── socket.js
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   │
│   ├── dashboard/
│   │   └── DashboardPage.jsx
│   │
│   ├── polls/
│   │   ├── CreatePollPage.jsx
│   │   ├── MyPollsPage.jsx
│   │   └── PollDetailPage.jsx
│   │
│   ├── analytics/
│   │   └── AnalyticsPage.jsx
│   │
│   ├── public/
│   │   ├── TakePollPage.jsx
│   │   └── ResultsPage.jsx
│   │
│   ├── HomePage.jsx
│   └── NotFoundPage.jsx
│
├── store/
│   └── authStore.js
│
├── App.jsx
├── main.jsx
└── index.css
```

---

# Environment Variables

Create a `.env` file:

```env id="btjlwm"
VITE_API_BASE=https://your-backend.railway.app
```

---

# Installation

## Clone Repository

```bash id="b7j1a0"
git clone <your-repo-url>
cd pollify-frontend
```

---

## Install Dependencies

```bash id="e8p0eu"
npm install
```

---

## Run Development Server

```bash id="8ojw9g"
npm run dev
```

---

## Build Production App

```bash id="f9h8yb"
npm run build
```

---

# Authentication Architecture

Pollify uses:

* Access Tokens stored in memory
* Refresh Tokens stored in secure httpOnly cookies
* Automatic token refresh via Axios interceptors
* Protected route guards

Axios auth implementation: 

Zustand auth store: 

---

# Real-Time Socket Rooms

## Public Poll Room

```js id="1faptr"
poll:{shareCode}
```

Receives:

* New response updates
* Poll expiration
* Result publication

---

## Creator Room

```js id="f2fpyh"
creator:{userId}
```

Receives:

* Creator notifications
* Milestone events

---

## Admin Analytics Room

```js id="lb0mbq"
poll:admin:{shareCode}
```

Receives:

* Live analytics updates
* Admin-only events

Socket client implementation: 

---

# Pages

## Home Page

Modern landing page featuring:

* Animated hero section
* Feature showcase
* Mock analytics preview
* CTA sections

Home page implementation: 

---

## Dashboard

Displays:

* Poll statistics
* Live response activity
* Recent polls
* Quick actions
* Real-time notifications

Dashboard implementation: 

---

## Create Poll

Features:

* Dynamic question builder
* Poll templates
* Validation
* Expiry settings
* Anonymous mode toggle

Create poll page: 

---

## Poll Detail

Includes:

* Share link
* QR code
* Embed code
* Poll management
* Publish controls
* Duplicate actions

Poll detail implementation: 

---

## Analytics

Interactive charts using Recharts:

* Line charts
* Pie charts
* Response metrics
* Engagement tracking
* Live analytics refresh

Analytics page: 

---

## Public Poll Page

Supports:

* Anonymous submissions
* Authenticated submissions
* Live response count
* Countdown timer
* Validation handling
* Expiry detection

Take poll implementation: 

---

## Results Page

Displays:

* Published results
* Pie chart visualizations
* Question summaries
* Public analytics

Results page implementation: 

---

# UI Components

## Common Components

| Component        | Purpose             |
| ---------------- | ------------------- |
| `ConfirmDialog`  | Confirmation modals |
| `LoadingSpinner` | Loading states      |
| `ProtectedRoute` | Route protection    |
| `QRCode`         | QR code generation  |

Common components implementation: 

---

# Animations

Using Framer Motion for:

* Page transitions
* Modal animations
* Card animations
* Interactive feedback
* Entrance effects

---

# Notifications

Toast notifications powered by:

* React Hot Toast

Configured globally in `main.jsx`. 

---

# Routing

Protected and public routes using React Router.

Routes include:

| Route                      | Description         |
| -------------------------- | ------------------- |
| `/`                        | Landing page        |
| `/login`                   | Login               |
| `/register`                | Register            |
| `/dashboard`               | User dashboard      |
| `/polls`                   | My polls            |
| `/polls/create`            | Create poll         |
| `/polls/:id`               | Poll details        |
| `/polls/:id/analytics`     | Analytics dashboard |
| `/poll/:shareCode`         | Public poll         |
| `/poll/:shareCode/results` | Public results      |

App routing: 

---

# Deployment

## Recommended Platforms

### Frontend

* Vercel

### Backend

* Railway
* Render

---

# Production Notes

## API Base URL

In development:

```js id="77pq7q"
baseURL = '/api'
```

In production:

```js id="v3md0y"
baseURL = 'https://your-backend.railway.app/api'
```

Axios configuration: 

---

## Secure Cookies

Cross-origin auth requires:

```js id="f0gmg5"
withCredentials: true
```

Already configured in Axios and Socket.IO.

---

# Performance Optimizations

* Debounced search
* Optimistic UI updates
* Lazy socket connection
* Request retry queue
* Real-time partial refresh
* Minimal re-renders using Zustand

Examples:

* Optimistic delete: 
* Refresh queue system: 

---

# Future Improvements

* Dark mode
* Drag-and-drop question ordering
* Rich text questions
* AI poll generation
* Multi-language support
* Poll themes
* Offline support
* PWA support

---

# Author

Built with ❤️ using:

* React
* Vite
* Socket.IO
* Tailwind CSS
