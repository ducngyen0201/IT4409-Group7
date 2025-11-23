const db = require('../db');

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