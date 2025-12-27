const db = require('../db');
const { createNotification } = require('./notificationController');

// 1. DUYỆT YÊU CẦU ĐĂNG KÝ
exports.approveEnrollment = async (req, res) => {
  try {
    const { id: courseId, enrollmentId } = req.params;
    const teacherId = req.user.userId;

    // KIỂM TRA QUYỀN (Giáo viên của khóa học)
    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, teacherId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không phải là giảng viên của khóa học này.' });
    }

    // DUYỆT ĐĂNG KÝ
    const updatedEnrollment = await db.query(
      `UPDATE enrollments
       SET status = 'APPROVED', approved_by = $1, approved_at = NOW()
       WHERE id = $2 AND course_id = $3 AND status = 'PENDING'
       RETURNING *`,
      [teacherId, enrollmentId, courseId]
    );

    if (updatedEnrollment.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy yêu cầu đăng ký đang chờ xử lý." });
    }

    const enrollmentData = updatedEnrollment.rows[0];
    
    // Lấy tên khóa học để làm thông báo sinh động hơn
    const courseRes = await db.query("SELECT title FROM courses WHERE id = $1", [courseId]);
    const courseTitle = courseRes.rows[0]?.title || "Khóa học";

    // GỬI THÔNG BÁO CHO HỌC SINH
    await createNotification(
      enrollmentData.student_id,
      'ENROLLMENT_APPROVED',
      `Yêu cầu tham gia khóa học "${courseTitle}" của bạn đã được chấp nhận!`,
      { course_id: courseId }
    );

    res.status(200).json(enrollmentData);

  } catch (err) {
    console.error("Lỗi khi duyệt đăng ký:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

// 2. TỪ CHỐI YÊU CẦU ĐĂNG KÝ
exports.rejectEnrollment = async (req, res) => {
  try {
    const { id: courseId, enrollmentId } = req.params;
    const teacherId = req.user.userId;
    const { note } = req.body || {};

    // KIỂM TRA QUYỀN
    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, teacherId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không phải là giảng viên của khóa học này.' });
    }

    // TỪ CHỐI
    const updatedEnrollment = await db.query(
      `UPDATE enrollments
       SET status = 'REJECTED', note = $1
       WHERE id = $2 AND course_id = $3 AND status = 'PENDING'
       RETURNING *`,
      [note || null, enrollmentId, courseId]
    );

    if (updatedEnrollment.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy yêu cầu đăng ký đang chờ xử lý." });
    }

    const enrollmentData = updatedEnrollment.rows[0];
    const courseRes = await db.query("SELECT title FROM courses WHERE id = $1", [courseId]);
    const courseTitle = courseRes.rows[0]?.title || "Khóa học";

    // GỬI THÔNG BÁO TỪ CHỐI CHO HỌC SINH
    await createNotification(
      enrollmentData.student_id,
      'ENROLLMENT_REJECTED',
      `Yêu cầu tham gia khóa học "${courseTitle}" của bạn đã bị từ chối.`,
      { course_id: courseId, reason: note }
    );

    res.status(200).json(enrollmentData);

  } catch (err) {
    console.error("Lỗi khi từ chối đăng ký:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

// 3. THÊM HỌC VIÊN TRỰC TIẾP VÀO LỚP
exports.addStudentToCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { email } = req.body;
    const teacherId = req.user.userId;

    // 1. Tìm thông tin học sinh dựa trên Email
    const studentQuery = await db.query(
      "SELECT id, full_name FROM users WHERE email = $1 AND role = 'STUDENT'",
      [email]
    );

    if (studentQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh có Email này.' });
    }
    const studentId = studentQuery.rows[0].id;

    // 2. Kiểm tra quyền của giáo viên
    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, teacherId]
    );
    if (checkOwnership.rows.length === 0) return res.status(403).json({ error: 'Không có quyền.' });

    // 3. Kiểm tra trùng lặp
    const checkExisting = await db.query(
      "SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2",
      [courseId, studentId]
    );
    if (checkExisting.rows.length > 0) return res.status(400).json({ error: 'Học sinh đã ở trong lớp.' });

    // 4. Thêm và duyệt ngay
    await db.query(
      `INSERT INTO enrollments (course_id, student_id, status, added_by, approved_by, approved_at) 
       VALUES ($1, $2, 'APPROVED', $3, $3, NOW())`,
      [courseId, studentId, teacherId]
    );

    // 5. Gửi thông báo (Sử dụng cột message mới)
    const courseRes = await db.query("SELECT title FROM courses WHERE id = $1", [courseId]);
    await createNotification(
      studentId,
      'ADDED_TO_COURSE',
      `Bạn đã được thêm vào khóa học "${courseRes.rows[0].title}".`,
      { course_id: courseId }
    );

    res.status(201).json({ message: "Đã thêm thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi Server" });
  }
};

// 4. LẤY DANH SÁCH ĐĂNG KÝ CỦA KHÓA HỌC
exports.getEnrollmentsForCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const teacherId = req.user.userId;

    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, teacherId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền xem dữ liệu này.' });
    }

    const enrollments = await db.query(
      `SELECT e.*, u.full_name, u.email, u.avatar 
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = $1
       ORDER BY e.requested_at DESC`,
      [courseId]
    );

    res.status(200).json(enrollments.rows);

  } catch (err) {
    console.error("Lỗi khi lấy danh sách đăng ký:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};