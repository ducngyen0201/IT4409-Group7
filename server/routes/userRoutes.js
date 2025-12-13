const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Chỉ Admin mới được vào đây
router.use(protect);
router.use(isAdmin);

// GET /api/users -> Xem danh sách
router.get('/', userController.getAllUsers);

// DELETE /api/users/:id -> Xóa user
router.delete('/:id', userController.deleteUser);

module.exports = router;