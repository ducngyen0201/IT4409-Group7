const db = require('../db');

exports.createCourse = async (req, res) => {
  // 1. Lấy thông tin từ client (khớp với sơ đồ mới)
  const { title, description, code } = req.body;
  
  // 2. Lấy ID giáo viên từ token (đã được giải mã bởi middleware 'protect')
  const teacherId = req.user.userId;

  // 3. Kiểm tra dữ liệu đầu vào
  if (!title || !description || !code) {
    return res.status(400).json({ 
      error: 'Tiêu đề, mô tả, và mã khóa học là bắt buộc.' 
    });
  }

  // Khởi tạo một client từ pool để dùng cho transaction
  const client = await db.getClient(); 

  try {
    // ----- BẮT ĐẦU TRANSACTION -----
    await client.query('BEGIN');

    // ----- Thao tác 1: TẠO KHÓA HỌC (bảng 'courses') -----
    // (Sử dụng các cột 'created_by', 'status' từ sơ đồ của bạn)
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

    // ----- Thao tác 2: THÊM GIÁO VIÊN VÀO 'course_instructors' -----
    // Đánh dấu người tạo là 'OWNER'
    const instructorQuery = `
      INSERT INTO course_instructors (course_id, user_id, role)
      VALUES ($1, $2, 'OWNER')
    `;
    await client.query(instructorQuery, [newCourse.id, teacherId]);

    // ----- KẾT THÚC TRANSACTION (Commit) -----
    // Nếu cả 2 thao tác thành công, lưu lại
    await client.query('COMMIT');

    // 4. Trả về khóa học đã tạo
    res.status(201).json(newCourse);

  } catch (err) {
    // ----- QUAY LUI (Rollback) -----
    // Nếu 1 trong 2 thao tác lỗi, hủy bỏ tất cả
    await client.query('ROLLBACK');

    console.error("Lỗi khi tạo khóa học (transaction):", err.message);

    // Xử lý lỗi nếu "code" (mã khóa học) bị trùng
    if (err.code === '23505') { // 23505 = unique_violation
       return res.status(400).json({ error: 'Mã khóa học này đã tồn tại.' });
    }

    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  } finally {
    // Luôn luôn giải phóng client trở lại pool
    client.release();
  }
};

// Lấy tất cả các khóa học ĐÃ ĐƯỢC DUYỆT (cho trang chủ)
exports.getAllPublishedCourses = async (req, res) => {
  try {
    // 1. Chỉ chọn các khóa học có status là 'APPROVED'
    // (Dựa trên Enum 'course_status' của bạn)
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
    // 1. Lấy ID của khóa học từ URL (ví dụ: /api/courses/1)
    const { id } = req.params;

    // ----- Truy vấn 1: Lấy thông tin khóa học -----
    const courseResult = await db.query(
      "SELECT * FROM courses WHERE id = $1", 
      [id]
    );

    // Kiểm tra xem khóa học có tồn tại không
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học.' });
    }
    const course = courseResult.rows[0];

    // ----- Truy vấn 2: Lấy tất cả bài giảng của khóa học đó -----
    // (Sắp xếp theo 'position' - thứ tự bài giảng)
    const lecturesResult = await db.query(
      "SELECT * FROM lectures WHERE course_id = $1 ORDER BY position ASC",
      [id]
    );
    const lectures = lecturesResult.rows;

    // 3. Gộp kết quả và trả về
    res.status(200).json({
      course: course,       // Thông tin khóa học
      lectures: lectures    // Danh sách bài giảng
    });

  } catch (err) {
    console.error("Lỗi khi lấy chi tiết khóa học:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};