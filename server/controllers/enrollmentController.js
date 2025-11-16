const db = require('../db');

exports.approveEnrollment = async (req, res) => {
  try {
    const { id: courseId, enrollmentId } = req.params;
    const teacherId = req.user.userId;

    // 1. KIỂM TRA QUYỀN (Giáo viên)
    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, teacherId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không phải là giảng viên của khóa học này.' });
    }

    // 2. KIỂM TRA YÊU CẦU (Phải đang 'PENDING')
    const enrollmentQuery = await db.query(
      "SELECT status FROM enrollments WHERE id = $1 AND course_id = $2 AND status = 'PENDING'",
      [enrollmentId, courseId]
    );

    if (enrollmentQuery.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy yêu cầu đăng ký đang chờ xử lý." });
    }

    // 3. DUYỆT
    const updatedEnrollment = await db.query(
      `UPDATE enrollments
       SET status = 'APPROVED', approved_by = $1, approved_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [teacherId, enrollmentId]
    );

    res.status(200).json(updatedEnrollment.rows[0]);

  } catch (err) {
    console.error("Lỗi khi duyệt đăng ký:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.rejectEnrollment = async (req, res) => {
  try {
    const { id: courseId, enrollmentId } = req.params;
    const teacherId = req.user.userId;
    const { note } = req.body || {};

    // 1. KIỂM TRA QUYỀN (Giáo viên)
    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, teacherId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không phải là giảng viên của khóa học này.' });
    }

    // 2. KIỂM TRA YÊU CẦU (Phải đang 'PENDING')
    const enrollmentQuery = await db.query(
      "SELECT status FROM enrollments WHERE id = $1 AND course_id = $2 AND status = 'PENDING'",
      [enrollmentId, courseId]
    );

    if (enrollmentQuery.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy yêu cầu đăng ký đang chờ xử lý." });
    }

    // 3. TỪ CHỐI
    const updatedEnrollment = await db.query(
      `UPDATE enrollments
       SET status = 'REJECTED', note = $1
       WHERE id = $2
       RETURNING *`,
      [note || null, enrollmentId]
    );

    res.status(200).json(updatedEnrollment.rows[0]);

  } catch (err) {
    console.error("Lỗi khi từ chối đăng ký:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};