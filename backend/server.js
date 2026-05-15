require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const pollRoutes = require('./src/routes/polls');
const responseRoutes = require('./src/routes/responses');
const errorHandler = require('./src/middleware/errorHandler');


const app = express();
const server = http.createServer(app);

// ─── CORS Origins ─────────────────────────────────────────────────────────────
// CLIENT_URL accepts a comma-separated list so you can whitelist both
// your Vercel preview URL and production URL without redeploying the backend.
//
// Example in .env:
//   CLIENT_URL=https://pollify.vercel.app,https://pollify-git-main.vercel.app
//
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman in dev)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true, // required for httpOnly cookie cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Replace:  app.use(cors({ origin: process.env.CLIENT_URL || '...', credentials: true }));
// With:
app.use(cors(corsOptions));

// Replace the Socket.IO cors block with:
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Trust proxy (Railway / Render / Heroku all sit behind a reverse proxy) ──
// Without this, req.ip returns '::ffff:127.0.0.1' for every request instead
// of the real client IP, breaking the anonymous duplicate-vote check.
app.set('trust proxy', 1);

// ─── Cookie security note ─────────────────────────────────────────────────────
// Your existing COOKIE_OPTS in authController.js already sets:
//   secure: process.env.NODE_ENV === 'production'
//   sameSite: production ? 'none' : 'strict'
// That is correct for cross-origin cookies. No change needed there.
// BUT sameSite:'none' REQUIRES secure:true. Ensure NODE_ENV=production
// is set in your Railway/Render environment variables.


app.set('io', io);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded;

    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // ── Public respondent rooms ────────────────────────────────────────────────
  socket.on('join:poll', (shareCode) => {
    socket.join(`poll:${shareCode}`);
  });

  socket.on('leave:poll', (shareCode) => {
    socket.leave(`poll:${shareCode}`);
  });

  // ── Creator notification room ──────────────────────────────────────────────
  socket.on('join:creator', (userId) => {
    socket.join(`creator:${userId}`);
  });

  socket.on('leave:creator', (userId) => {
    socket.leave(`creator:${userId}`);
  });

  // ── Isolated admin analytics room ──────────────────────────────────────────
  // Separate from poll:{shareCode} so respondents never receive analytics payloads.
  // Only the poll creator's analytics dashboard joins this room.
  socket.on('join:admin', (shareCode) => {
    socket.join(`poll:admin:${shareCode}`);
  });

  socket.on('leave:admin', (shareCode) => {
    socket.leave(`poll:admin:${shareCode}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Connect DB ───────────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// Submission-specific rate limiter
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many submissions. Please wait before trying again.' },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/responses', submitLimiter, responseRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Pollify API is running', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Pollify server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
  setTimeout(() => { process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server };