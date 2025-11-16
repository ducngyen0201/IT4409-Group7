const express = require('express');
const router = express.Router(); 

const { protect, isStudent } = require('../middleware/authMiddleware');
const meController = require('../controllers/meController');

router.get(
  '/',
  protect,
  meController.getMe
);

router.patch(
  '/',
  protect,
  meController.updateMe
);

router.get(
  '/enrollments',
  protect,
  isStudent,
  meController.getMyEnrollments
);

module.exports = router;