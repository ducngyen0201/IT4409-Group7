const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', authController.register);

//STT 1
router.post('/login', authController.login);

router.post('/forgot-password-check', authController.forgotPasswordCheck);
router.post('/reset-password-quick', authController.resetPasswordQuick);

module.exports = router;