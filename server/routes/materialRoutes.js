// materialRoutes.js
const express = require('express');
const router = express.Router();
const { protect, isTeacher } = require('../middleware/authMiddleware');
const materialController = require('../controllers/materialController');

// STT 31 - Xóa tài liệu
router.delete('/:id', protect, isTeacher, materialController.deleteMaterial);

// Cập nhật thông tin
router.patch('/:id', protect, isTeacher, materialController.updateMaterial);

module.exports = router;