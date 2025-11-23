const express = require('express');
const router = express.Router();
const { protect, isStudent } = require('../middleware/authMiddleware');
const attemptController = require('../controllers/attemptController');

//STT 42
router.get('/:id', protect, attemptController.getAttemptDetails);

// STT 43
router.post('/:id/answer', protect, isStudent, attemptController.submitAnswer);

// STT 44
router.post('/:id/submit', protect, isStudent, attemptController.submitAttempt);

module.exports = router;