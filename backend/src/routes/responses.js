const express = require('express');
const { submitResponse, getMyResponses } = require('../controllers/responseController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/:shareCode/submit', optionalAuth, submitResponse);
router.get('/my', protect, getMyResponses);

module.exports = router;