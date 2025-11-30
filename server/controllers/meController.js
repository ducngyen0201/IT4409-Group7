const db = require('../db');
const bcrypt = require('bcrypt');

exports.getMyEnrollments = async (req, res) => {
  try {
    // 1. Lấy ID học sinh từ token (đã được 'protect' giải mã)
    const studentId = req.user.userId;

    // 2. LẤY TẤT CẢ ENROLLMENTS CỦA HỌC SINH NÀY
    const myEnrollments = await db.query(
      `SELECT e.status, e.requested_at, e.approved_at,
              c.id as course_id, c.code, c.title, c.description
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = $1
       ORDER BY e.requested_at DESC`,
      [studentId]
    );

    // 3. Trả về danh sách
    res.status(200).json(myEnrollments.rows);

  } catch (err) {
    console.error("Lỗi khi lấy danh sách khóa học của tôi:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.getMe = async (req, res) => {
  try {
    // 1. Lấy ID người dùng từ token
    const userId = req.user.userId;

    // 2. Lấy thông tin user từ database
    const userQuery = await db.query(
      "SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    // 3. Trả về thông tin
    res.status(200).json(userQuery.rows[0]);

  } catch (err) {
    console.error("Lỗi khi lấy thông tin /me:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    // 1. Lấy ID người dùng từ token
    const userId = req.user.userId;

    // 2. Lấy dữ liệu mới từ body
    const { full_name } = req.body;

    // 3. Xây dựng câu lệnh UPDATE động
    const fields = [];
    const values = [];
    let queryIndex = 1;

    if (full_name) {
      fields.push(`full_name = $${queryIndex++}`);
      values.push(full_name);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Không có trường nào để cập nhật.' });
    }

    values.push(userId);

    // 4. Thực thi câu lệnh UPDATE
    const updateQuery = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${queryIndex}
      RETURNING id, email, full_name, role, is_active, created_at
    `;

    const updatedUser = await db.query(updateQuery, values);

    res.status(200).json(updatedUser.rows[0]);

  } catch (err) {
    console.error("Lỗi khi cập nhật /me:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.getMyQuizzes = async (req, res) => {
  try {
    const studentId = req.user.userId;

    // Lấy danh sách các lần làm bài, kèm thông tin Quiz và Khóa học
    const result = await db.query(
      `SELECT qa.*, q.title as quiz_title, c.title as course_title
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN lectures l ON q.lecture_id = l.id
       JOIN courses c ON l.course_id = c.id
       WHERE qa.student_id = $1
       ORDER BY qa.started_at DESC`,
      [studentId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // 1. Kiểm tra input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' });
    }

    // 2. Lấy mật khẩu đã mã hóa (password_hash) từ database
    const userQuery = await db.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }
    const user = userQuery.rows[0];

    // 3. So sánh mật khẩu hiện tại (Client gửi) với mật khẩu trong DB
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
    }

    // 4. Mã hóa mật khẩu MỚI
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 5. Cập nhật vào Database
    await db.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newPasswordHash, userId]
    );

    res.status(200).json({ message: 'Đổi mật khẩu thành công.' });

  } catch (err) {
    console.error("Lỗi đổi mật khẩu:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

// [API Bổ sung] Lấy danh sách khóa học do tôi dạy (Cho Teacher)
exports.getMyTeachingCourses = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    // Lấy tất cả khóa học mà user này là 'OWNER' hoặc 'ASSISTANT'
    const result = await db.query(
      `SELECT c.*, ci.role as instructor_role
       FROM courses c
       JOIN course_instructors ci ON c.id = ci.course_id
       WHERE ci.user_id = $1
       ORDER BY c.created_at DESC`,
      [teacherId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};