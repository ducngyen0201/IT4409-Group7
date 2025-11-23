const db = require('../db');


exports.createNotification = async (userId, type, payload) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, payload_json, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, type, JSON.stringify(payload)]
    );
  } catch (err) {
    console.error("Lỗi tạo notification nội bộ:", err.message);
  }
};

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Lấy thông báo, sắp xếp mới nhất lên đầu
    const result = await db.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.status(200).json(result.rows);

  } catch (err) {
    console.error("Lỗi lấy thông báo:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: notificationId } = req.params;

    const result = await db.query(
      `UPDATE notifications 
       SET read_at = NOW() 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Thông báo không tìm thấy hoặc không phải của bạn." });
    }

    res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error("Lỗi đánh dấu đã đọc:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};