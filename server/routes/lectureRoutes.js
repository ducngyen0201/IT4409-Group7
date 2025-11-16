const express = require('express');
const router = express.Router();

const { protect, isTeacher } = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig'); // Import config multer
const materialController = require('../controllers/materialController'); // Import controller

router.post(
  '/:id/materials', // ':id' ở đây chính là lecture_id
  protect,
  isTeacher,
  upload.single('material'), // Middleware của Multer
  materialController.uploadMaterial // Controller xử lý
);

// (Chúng ta sẽ sớm thêm các route khác như GET /:id, PATCH /:id vào đây)

module.exports = router;