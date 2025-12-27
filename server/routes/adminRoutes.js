const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Tất cả các route dưới đây đều yêu cầu Login (protect) và quyền ADMIN (isAdmin)
router.use(protect);
router.use(isAdmin);

// GET /api/admin/courses
router.get('/courses', adminController.getAllCourses);

// PATCH /api/admin/courses/:id/status
router.patch('/courses/:id/status', adminController.updateCourseStatus);

// GET /api/admin/users
router.get('/users', adminController.getAllUsers);

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', adminController.toggleUserStatus);

module.exports = router;