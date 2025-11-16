const express = require('express');
const router = express.Router();
const { protect, isTeacher } = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig'); // Import config multer

const materialController = require('../controllers/materialController');

// Định nghĩa route: Upload 1 file 'material' cho 1 bài giảng 'lectureId'
router.post('/', protect, isTeacher, upload.single('material'), materialController.uploadMaterial);

module.exports = router;