const express = require('express');
const router = express.Router({ mergeParams: true }); 

const { protect, isTeacher } = require('../middleware/authMiddleware');
const enrollmentController = require('../controllers/enrollmentController');

//STT 20
router.get(
  '/',
  protect,
  isTeacher,
  enrollmentController.getEnrollmentsForCourse
);

//STT 21
router.post(
  '/:enrollmentId/approve',
  protect,
  isTeacher,
  enrollmentController.approveEnrollment
);

//STT 22
router.post(
  '/:enrollmentId/reject',
  protect,
  isTeacher,
  enrollmentController.rejectEnrollment
);

//STT 23
router.post(
  '/add',
  protect,
  isTeacher,
  enrollmentController.addStudentToCourse
);


module.exports = router;