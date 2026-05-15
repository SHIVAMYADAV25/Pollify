const express = require('express');
const { createPollSchema, validate } = require('../validators/pollValidator');
const {
  createPoll, getMyPolls, getPollById, getPollByShareCode,
  updatePoll, deletePoll, publishResults, getPollAnalytics,
  closePoll, getDashboardStats, duplicatePoll, exportCsv, getEmbedCode,
} = require('../controllers/pollController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/my', protect, getMyPolls);
router.get('/dashboard', protect, getDashboardStats);
router.get('/share/:shareCode', optionalAuth, getPollByShareCode);

// Zod validation replaces express-validator here
router.post('/', protect, validate(createPollSchema), createPoll);

router.get('/:id/analytics', protect, getPollAnalytics);
router.post('/:id/publish', protect, publishResults);
router.post('/:id/close', protect, closePoll);
router.post('/:id/duplicate', protect, duplicatePoll);
router.get('/:id/export-csv', protect, exportCsv);
router.get('/:id/embed', protect, getEmbedCode);
router.get('/:id', protect, getPollById);
router.patch('/:id', protect, updatePoll);
router.delete('/:id', protect, deletePoll);

module.exports = router;