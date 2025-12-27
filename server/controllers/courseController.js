const db = require('../db');
const { createNotification } = require('./notificationController');

exports.createCourse = async (req, res) => {
  const { title, description, code } = req.body;
  const teacherId = req.user.userId;

  if (!title || !description || !code) {
    return res.status(400).json({ 
      error: 'Tiêu đề, mô tả, và mã khóa học là bắt buộc.' 
    });
  }

  const client = await db.getClient(); 

  try {
    await client.query('BEGIN');

    const courseQuery = `
      INSERT INTO courses (title, description, code, created_by, status, is_enrollment_open)
      VALUES ($1, $2, $3, $4, 'DRAFT', true)
      RETURNING *
    `;
    const courseResult = await client.query(courseQuery, [
      title, 
      description, 
      code, 
      teacherId
    ]);
    
    const newCourse = courseResult.rows[0];
    const instructorQuery = `
      INSERT INTO course_instructors (course_id, user_id, role)
      VALUES ($1, $2, 'OWNER')
    `;
    await client.query(instructorQuery, [newCourse.id, teacherId]);

    await client.query('COMMIT');

    res.status(201).json(newCourse);

  } catch (err) {
    await client.query('ROLLBACK');

    console.error("Lỗi khi tạo khóa học (transaction):", err.message);
    if (err.code === '23505') {
       return res.status(400).json({ error: 'Mã khóa học này đã tồn tại.' });
    }

    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  } finally {
    client.release();
  }
};

// Lấy tất cả các khóa học ĐÃ ĐƯỢC DUYỆT (cho trang chủ)
exports.getAllPublishedCourses = async (req, res) => {
  try {
    // 1. Chỉ chọn các khóa học có status là 'APPROVED'
    const courses = await db.query(
      "SELECT * FROM courses WHERE status = 'APPROVED' ORDER BY created_at DESC"
    );

    // 2. Trả về mảng các khóa học
    res.status(200).json(courses.rows);

  } catch (err) {
    console.error("Lỗi khi lấy danh sách khóa học:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Lấy thông tin khóa học
    const courseResult = await db.query("SELECT * FROM courses WHERE id = $1", [id]);

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học.' });
    }
    const course = courseResult.rows[0];

    // 2. Logic Phân quyền (Giữ nguyên)
    let showAllLectures = false;
    if (req.user && (req.user.role === 'TEACHER' || req.user.role === 'ADMIN')) {
      const instructorCheck = await db.query(
        "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
        [id, req.user.userId]
      );
      if (instructorCheck.rows.length > 0) {
        showAllLectures = true;
      }
    }

    // 3. Lấy danh sách bài giảng + THÔNG TIN QUIZ (Sửa đoạn này)
    let query = `
      SELECT l.*, 
             q.id as quiz_id, 
             q.is_published as quiz_published 
      FROM lectures l
      LEFT JOIN quizzes q ON l.id = q.lecture_id
      WHERE l.course_id = $1
    `;
    
    // Nếu KHÔNG phải chủ sở hữu -> Chỉ lấy bài đã publish
    if (!showAllLectures) {
      query += " AND l.is_published = true";
    }

    query += " ORDER BY l.position ASC";

    const lecturesResult = await db.query(query, [id]);
    const lectures = lecturesResult.rows;

    res.status(200).json({
      course: course,
      lectures: lectures
    });

  } catch (err) {
    console.error("Lỗi khi lấy chi tiết khóa học:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    // 1. Lấy ID khóa học từ URL và ID giáo viên từ token
    const { id: courseId } = req.params;
    const teacherId = req.user.userId;

    // 2. Lấy dữ liệu mới từ body
    const { title, description, code, is_enrollment_open } = req.body;

    // 3. KIỂM TRA QUYỀN SỞ HỮU
    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2 AND role = 'OWNER'",
      [courseId, teacherId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Bạn không có quyền (Không phải chủ sở hữu) để sửa khóa học này.' 
      });
    }

    // 4. Nếu có quyền -> Cập nhật khóa học
    const fields = [];
    const values = [];
    let queryIndex = 1;

    if (title) {
      fields.push(`title = $${queryIndex++}`);
      values.push(title);
    }
    if (description) {
      fields.push(`description = $${queryIndex++}`);
      values.push(description);
    }
    if (code) {
      fields.push(`code = $${queryIndex++}`);
      values.push(code);
    }
    if (is_enrollment_open !== undefined) { // Cho phép set true/false
      fields.push(`is_enrollment_open = $${queryIndex++}`);
      values.push(is_enrollment_open);
    }

    // Thêm cột 'updated_at'
    fields.push(`updated_at = $${queryIndex++}`);
    values.push(new Date());

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Không có trường nào để cập nhật.' });
    }

    // Thêm ID khóa học vào cuối mảng values
    values.push(courseId);

    // 5. Xây dựng và thực thi câu lệnh UPDATE
    const updateQuery = `
      UPDATE courses
      SET ${fields.join(', ')}
      WHERE id = $${queryIndex}
      RETURNING *
    `;

    const updatedCourse = await db.query(updateQuery, values);

    res.status(200).json(updatedCourse.rows[0]);

  } catch (err) {
    console.error("Lỗi khi cập nhật khóa học:", err.message);
    // Lỗi nếu 'code' bị trùng
    if (err.code === '23505') {
       return res.status(400).json({ error: 'Mã khóa học này đã tồn tại.' });
    }
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.requestCourseReview = async (req, res) => {
  try {
    // 1. Lấy ID khóa học từ URL và ID giáo viên từ token
    const { id: courseId } = req.params;
    const teacherId = req.user.userId;

    // 2. KIỂM TRA QUYỀN SỞ HỮU (Giáo viên phải là giảng viên của khóa này)
    const checkOwnership = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, teacherId]
    );

    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Bạn không có quyền (Không phải giảng viên) với khóa học này.' 
      });
    }

    // 3. Lấy khóa học để kiểm tra trạng thái hiện tại
    const courseQuery = await db.query(
      "SELECT status FROM courses WHERE id = $1", 
      [courseId]
    );
    const currentStatus = courseQuery.rows[0].status;

    // 4. Chỉ cho phép gửi duyệt nếu đang là 'DRAFT'
    if (currentStatus !== 'DRAFT') {
      return res.status(400).json({ 
        error: `Chỉ có thể yêu cầu duyệt khi khóa học ở trạng thái 'DRAFT'. (Hiện tại là: ${currentStatus})` 
      });
    }

    // 5. Nếu có quyền -> Cập nhật trạng thái
    const updatedCourse = await db.query(
      `UPDATE courses
       SET status = 'PENDING_REVIEW', requested_review_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [courseId]
    );

    res.status(200).json(updatedCourse.rows[0]);

  } catch (err) {
    console.error("Lỗi khi gửi yêu cầu duyệt:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.requestEnrollment = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const studentId = req.user.userId; // Đồng bộ với userId từ token

    // 1. Kiểm tra khóa học tồn tại và trạng thái
    const courseQuery = await db.query(
      "SELECT is_enrollment_open, status, title FROM courses WHERE id = $1", 
      [courseId]
    );

    if (courseQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học.' });
    }

    const course = courseQuery.rows[0];
    if (course.status !== 'APPROVED' || !course.is_enrollment_open) {
      return res.status(400).json({ error: 'Khóa học này hiện không nhận đăng ký.' });
    }

    // 2. Kiểm tra đăng ký trùng lặp
    const checkExisting = await db.query(
      "SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2",
      [courseId, studentId]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(400).json({ error: 'Bạn đã gửi yêu cầu hoặc đã tham gia khóa học này.' });
    }

    // 3. THÊM VÀO BẢNG ENROLLMENTS VỚI STATUS 'PENDING'
    const newEnrollment = await db.query(
      `INSERT INTO enrollments (course_id, student_id, status, requested_at) 
       VALUES ($1, $2, 'PENDING', NOW()) 
       RETURNING *`,
      [courseId, studentId]
    );

    // 4. GỬI THÔNG BÁO CHO GIÁO VIÊN
    // Lấy tên học sinh vừa đăng ký
    const studentRes = await db.query("SELECT full_name FROM users WHERE id = $1", [studentId]);
    const studentName = studentRes.rows[0]?.full_name || "Một học sinh";

    // Tìm tất cả giảng viên của khóa học này
    const instructors = await db.query(
      "SELECT user_id FROM course_instructors WHERE course_id = $1",
      [courseId]
    );

    // Gửi thông báo đến từng giảng viên
    const notificationPromises = instructors.rows.map(inst => 
      createNotification(
        inst.user_id,
        'NEW_ENROLLMENT_REQUEST',
        `Học viên ${studentName} vừa đăng ký tham gia khóa học "${course.title}".`,
        { course_id: courseId, student_id: studentId }
      )
    );
    await Promise.all(notificationPromises);

    res.status(201).json(newEnrollment.rows[0]);

  } catch (err) {
    console.error("Lỗi khi đăng ký khóa học:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

// Hàm Duyệt khóa học
exports.approveCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const adminId = req.user.userId;

    // Cập nhật status thành APPROVED
    const result = await db.query(
      `UPDATE courses 
       SET status = 'APPROVED', 
           reviewed_by = $1, 
           reviewed_at = NOW(), 
           published_at = NOW(),
           reject_reason = NULL -- Xóa lý do từ chối cũ nếu có
       WHERE id = $2
       RETURNING *`,
      [adminId, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học.' });
    }

    const courseData = result.rows[0];

    // --- GỬI THÔNG BÁO CHO GIÁO VIÊN ---
    await createNotification(
      courseData.created_by, // ID giáo viên tạo khóa học
      'COURSE_APPROVED',
      `Chúc mừng! Khóa học "${courseData.title}" của bạn đã được phê duyệt và công khai.`,
      { course_id: courseId, status: 'APPROVED' }
    );

    res.status(200).json(courseData);
  } catch (err) {
    console.error("Lỗi duyệt khóa học:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

//Hàm Từ Chối Khóa Học
exports.rejectCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const adminId = req.user.userId;
    const { reason } = req.body || {};

    // Cập nhật status thành REJECTED (hoặc DRAFT tùy theo logic của bạn)
    const result = await db.query(
      `UPDATE courses 
       SET status = 'REJECTED', 
           reviewed_by = $1, 
           reviewed_at = NOW(),
           reject_reason = $2 
       WHERE id = $3
       RETURNING *`,
      [adminId, reason || 'Nội dung chưa phù hợp', courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học.' });
    }

    const courseData = result.rows[0];

    // --- GỬI THÔNG BÁO CHO GIÁO VIÊN ---
    await createNotification(
      courseData.created_by,
      'COURSE_REJECTED',
      `Khóa học "${courseData.title}" bị từ chối phê duyệt. Lý do: ${reason || 'Vui lòng kiểm tra lại nội dung.'}`,
      { course_id: courseId, status: 'REJECTED', reason: reason }
    );

    res.status(200).json(courseData);
  } catch (err) {
    console.error("Lỗi từ chối khóa học:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

// [API MỚI] Lấy thống kê học viên của một khóa học
exports.getCourseStats = async (req, res) => {
  const { id: courseId } = req.params;

  try {
    const totalLecturesRes = await db.query(
      'SELECT COUNT(*) FROM public.lectures WHERE course_id = $1',
      [courseId]
    );
    const totalLectures = parseInt(totalLecturesRes.rows[0].count) || 0;

    const statsQuery = `
      SELECT 
        u.id AS student_id, 
        u.full_name, 
        u.email, 
        u.avatar, 
        e.id AS enrollment_id, -- Lấy ID này để thực hiện duyệt
        e.status AS enrollment_status, -- Lấy trạng thái để phân loại ở Frontend
        e.requested_at, 
        COUNT(lp.id) FILTER (WHERE lp.completed_at IS NOT NULL) AS completed_count
      FROM public.users u
      JOIN public.enrollments e ON u.id = e.student_id
      LEFT JOIN public.lecture_progress lp ON u.id = lp.student_id AND lp.lecture_id IN (
        SELECT id FROM public.lectures WHERE course_id = $1
      )
      WHERE e.course_id = $1 
      AND e.status IN ('APPROVED', 'PENDING') -- Lấy cả 2 trạng thái
      GROUP BY u.id, e.id, e.status, e.requested_at
      ORDER BY 
        CASE WHEN e.status = 'APPROVED' THEN 1 ELSE 2 END, -- APPROVED lên đầu
        e.requested_at DESC
    `;

    const statsRes = await db.query(statsQuery, [courseId]);

    const students = statsRes.rows.map(student => {
      const completed = parseInt(student.completed_count) || 0;
      return {
        ...student,
        progress_percent: totalLectures > 0 && student.enrollment_status === 'APPROVED'
          ? Math.round((completed / totalLectures) * 100) 
          : 0
      };
    });

    res.json({
      total_students: students.filter(s => s.enrollment_status === 'APPROVED').length,
      pending_students: students.filter(s => s.enrollment_status === 'PENDING').length,
      total_lectures: totalLectures,
      students: students
    });

  } catch (err) {
    console.error("Lỗi lấy thống kê khóa học:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};
