const express = require('express');
const router = express.Router({ mergeParams: true }); 

const { protect, isTeacher } = require('../middleware/authMiddleware');
const enrollmentController = require('../controllers/enrollmentController');

// --- ROUTE 1: DUYỆT ---
router.post(
  '/:enrollmentId/approve',
  protect,
  isTeacher,
  enrollmentController.approveEnrollment
);

// --- ROUTE 2: TỪ CHỐI ---
router.post(
  '/:enrollmentId/reject',
  protect,
  isTeacher,
  enrollmentController.rejectEnrollment
);

module.exports = router;