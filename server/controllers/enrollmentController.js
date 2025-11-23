const db = require('../db');

const { createNotification } = require('./notificationController');

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

    const enrollmentData = updatedEnrollment.rows[0];
    
    await createNotification(
      enrollmentData.student_id,
      'ENROLLMENT_APPROVED',
      {
        course_id: courseId,
        message: 'Yêu cầu đăng ký khóa học của bạn đã được chấp nhận!'
      }
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
exports.addStudentToCourse = async (req, res) => {
  try {
    // 1. Lấy ID khóa học từ URL và ID giáo viên từ token
    const { id: courseId } = req.params;
    const teacherId = req.user.userId;

    // 2. Lấy ID của học sinh cần thêm (từ body)
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'Bạn phải cung cấp student_id.' });
    }

    // 3. KIỂM TRA QUYỀN: Bạn có phải là giảng viên của khóa học này không?
    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, teacherId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Bạn không phải là giảng viên của khóa học này.' 
      });
    }

    // 4. KIỂM TRA HỌC SINH: Học sinh (student_id) có tồn tại không?
    const studentQuery = await db.query(
      "SELECT * FROM users WHERE id = $1 AND role = 'STUDENT'",
      [student_id]
    );

    if (studentQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh này.' });
    }

    // 5. KIỂM TRA TRÙNG LẶP: Học sinh này đã ở trong lớp chưa?
    const checkExisting = await db.query(
      "SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2",
      [courseId, student_id]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Học sinh này đã ở trong khóa học.',
        details: checkExisting.rows[0]
      });
    }

    // 6. NẾU MỌI THỨ OK -> THÊM VÀ DUYỆT NGAY LẬP TỨC
    const newEnrollment = await db.query(
      `INSERT INTO enrollments (course_id, student_id, status, added_by, approved_by, approved_at) 
       VALUES ($1, $2, 'APPROVED', $3, $3, NOW()) 
       RETURNING *`,
      [courseId, student_id, teacherId]
    );

    res.status(201).json(newEnrollment.rows[0]);

  } catch (err) {
    console.error("Lỗi khi thêm học viên:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.getEnrollmentsForCourse = async (req, res) => {
  try {
    // 1. Lấy ID khóa học từ URL và ID giáo viên từ token
    const { id: courseId } = req.params;
    const teacherId = req.user.userId;

    // 2. KIỂM TRA QUYỀN: Bạn có phải là giảng viên của khóa học này không?
    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, teacherId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Bạn không phải là giảng viên của khóa học này.' 
      });
    }

    // 3. NẾU CÓ QUYỀN -> LẤY TẤT CẢ ENROLLMENTS CỦA KHÓA HỌC NÀY
    const enrollments = await db.query(
      `SELECT e.*, u.full_name, u.email 
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = $1
       ORDER BY e.requested_at DESC`,
      [courseId]
    );

    // 4. Trả về danh sách
    res.status(200).json(enrollments.rows);

  } catch (err) {
    console.error("Lỗi khi lấy danh sách đăng ký:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};