const express = require('express');
const router = express.Router();

// Import 2 "bảo vệ"
const { protect, isTeacher } = require('../middleware/authMiddleware');

// Import controller (sẽ tạo ở bước 2)
const lectureController = require('../controllers/lectureController');

// API để tạo một bài giảng mới
router.post('/', protect, isTeacher, lectureController.createLecture);

module.exports = router;