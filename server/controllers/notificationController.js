const db = require('../db');

// 1. Hàm nội bộ để các Controller khác gọi (Không có req, res)
exports.createNotification = async (userId, type, message, payload = {}) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, message, payload_json) 
       VALUES ($1, $2, $3, $4)`,
      [userId, type, message, JSON.stringify(payload)]
    );
  } catch (err) {
    console.error("Lỗi tạo thông báo nội bộ:", err.message);
  }
};

// 2. API: Lấy danh sách thông báo của tôi (STT 56)
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await db.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 3. API: Đánh dấu đã đọc (STT 57)
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId; //
    
    await db.query(
      "UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    res.status(200).json({ message: "Đã đọc" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
};