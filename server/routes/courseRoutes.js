const express = require('express');
const router = express.Router();

// 1. Import "bảo vệ"
const { protect, isTeacher } = require('../middleware/authMiddleware');
const courseController = require('../controllers/courseController');

// 2. Sử dụng "bảo vệ"
router.post('/', protect, isTeacher, courseController.createCourse);
router.get('/', courseController.getAllPublishedCourses);
router.get('/:id', courseController.getCourseDetails);

module.exports = router;