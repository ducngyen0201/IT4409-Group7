const db = require('../db');

// 1. Lấy danh sách tất cả khóa học (Kèm tên giáo viên)
exports.getAllCourses = async (req, res) => {
  try {
    const query = `
      SELECT c.*, u.full_name as instructor_name, u.email as instructor_email
      FROM courses c
      JOIN course_instructors ci ON c.id = ci.course_id
      JOIN users u ON ci.user_id = u.id
      ORDER BY 
        CASE WHEN c.status = 'PENDING_REVIEW' THEN 0 ELSE 1 END, 
        c.updated_at ASC
    `;
    const result = await db.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi Server' });
  }
};

// 2. Cập nhật trạng thái khóa học (Duyệt/Từ chối)
exports.updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' hoặc 'DRAFT' (Từ chối)

    if (!['APPROVED', 'DRAFT', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
    }

    const result = await db.query(
      "UPDATE courses SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học.' });
    }

    // (Tùy chọn) Gửi thông báo cho giáo viên ở đây...

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi Server' });
  }
};