// server/controllers/userController.js
const db = require('../db');

// Admin xem danh sách tất cả user
exports.getAllUsers = async (req, res) => {
  try {
    // Chỉ lấy thông tin cơ bản, KHÔNG lấy password
    const result = await db.query(
        "SELECT id, full_name, email, role, avatar, is_active, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin xóa user (Hoặc khóa user)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Admin không được tự xóa chính mình
    if (id == req.user.userId) {
        return res.status(400).json({ error: "Không thể tự xóa tài khoản Admin đang đăng nhập" });
    }
    
    await db.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "Đã xóa người dùng thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// (Tùy chọn) Admin Khóa/Mở khóa tài khoản (Thay vì xóa vĩnh viễn)
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body; // true hoặc false
        await db.query("UPDATE users SET is_active = $1 WHERE id = $2", [is_active, id]);
        res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}