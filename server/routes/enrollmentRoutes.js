const express = require('express');
const router = express.Router({ mergeParams: true }); 

const { protect, isTeacher } = require('../middleware/authMiddleware');
const enrollmentController = require('../controllers/enrollmentController');

router.get(
  '/',
  protect,
  isTeacher,
  enrollmentController.getEnrollmentsForCourse
);

router.post(
  '/:enrollmentId/approve',
  protect,
  isTeacher,
  enrollmentController.approveEnrollment
);

router.post(
  '/:enrollmentId/reject',
  protect,
  isTeacher,
  enrollmentController.rejectEnrollment
);
router.post(
  '/add',
  protect,
  isTeacher,
  enrollmentController.addStudentToCourse
);


module.exports = router;