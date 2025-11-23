const db = require('../db');

// Kiểm tra quyền truy cập bài giảng (theo userId và userRole)
const checkLectureAccess = async (lectureId, userId, userRole) => {
  // 1. Lấy course_id của bài giảng
  const lectureQuery = await db.query("SELECT course_id FROM lectures WHERE id = $1", [lectureId]);
  if (lectureQuery.rows.length === 0) return false;
  const courseId = lectureQuery.rows[0].course_id;

  if (userRole === 'TEACHER' || userRole === 'ADMIN') {
    const instructorCheck = await db.query(
      "SELECT * FROM course_instructors WHERE course_id = $1 AND user_id = $2",
      [courseId, userId]
    );
    return instructorCheck.rows.length > 0;
  } 
  
  if (userRole === 'STUDENT') {
    const enrollmentCheck = await db.query(
      "SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2 AND status = 'APPROVED'",
      [courseId, userId]
    );
    return enrollmentCheck.rows.length > 0;
  }
  return false;
};

exports.createThread = async (req, res) => {
  try {
    const { id: lectureId } = req.params;
    const userId = req.user.userId;
    const { title } = req.body;

    // 1. Kiểm tra quyền
    const hasAccess = await checkLectureAccess(lectureId, userId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bạn không có quyền thảo luận trong bài giảng này.' });
    }

    // 2. Tạo Thread
    const newThread = await db.query(
      `INSERT INTO discussion_threads (lecture_id, created_by, title)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [lectureId, userId, title]
    );

    res.status(201).json(newThread.rows[0]);

  } catch (err) {
    console.error("Lỗi tạo thread:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.getThreadsByLecture = async (req, res) => {
  try {
    const { id: lectureId } = req.params;
    const userId = req.user.userId;

    // 1. Kiểm tra quyền
    const hasAccess = await checkLectureAccess(lectureId, userId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thảo luận.' });
    }

    // 2. Lấy danh sách Thread (Kèm thông tin người tạo)
    const threads = await db.query(
      `SELECT t.*, u.full_name as author_name 
       FROM discussion_threads t
       JOIN users u ON t.created_by = u.id
       WHERE t.lecture_id = $1
       ORDER BY t.created_at DESC`,
      [lectureId]
    );

    res.status(200).json(threads.rows);

  } catch (err) {
    console.error("Lỗi lấy danh sách thread:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { id: threadId } = req.params;
    const userId = req.user.userId;
    const { body, parent_post_id } = req.body; // body là nội dung cmt

    // 1. Kiểm tra Thread tồn tại và lấy Lecture ID
    const threadCheck = await db.query("SELECT lecture_id FROM discussion_threads WHERE id = $1", [threadId]);
    if (threadCheck.rows.length === 0) return res.status(404).json({ error: 'Thread không tồn tại.' });
    
    const lectureId = threadCheck.rows[0].lecture_id;

    // 2. Kiểm tra quyền (Dựa trên lecture)
    const hasAccess = await checkLectureAccess(lectureId, userId, req.user.role);
    if (!hasAccess) return res.status(403).json({ error: 'Không có quyền bình luận.' });

    // 3. Tạo Post
    const newPost = await db.query(
      `INSERT INTO discussion_posts (thread_id, author_id, body, parent_post_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [threadId, userId, body, parent_post_id || null]
    );

    res.status(201).json(newPost.rows[0]);

  } catch (err) {
    console.error("Lỗi tạo post:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.getPostsByThread = async (req, res) => {
  try {
    const { id: threadId } = req.params;
    const userId = req.user.userId;

    // 1. Kiểm tra Thread và quyền (tương tự createPost)
    const threadCheck = await db.query("SELECT lecture_id FROM discussion_threads WHERE id = $1", [threadId]);
    if (threadCheck.rows.length === 0) return res.status(404).json({ error: 'Thread không tồn tại.' });
    
    const hasAccess = await checkLectureAccess(threadCheck.rows[0].lecture_id, userId, req.user.role);
    if (!hasAccess) return res.status(403).json({ error: 'Không có quyền xem bình luận.' });

    // 2. Lấy Posts (Kèm tên tác giả)
    const posts = await db.query(
      `SELECT p.*, u.full_name as author_name 
       FROM discussion_posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.thread_id = $1
       ORDER BY p.created_at ASC`,
      [threadId]
    );

    res.status(200).json(posts.rows);

  } catch (err) {
    console.error("Lỗi lấy post:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.userId;
    const { body } = req.body;

    // Kiểm tra quyền: Chỉ tác giả bài viết (hoặc Giáo viên) mới được sửa
    const postCheck = await db.query(
      `SELECT p.author_id, ci.user_id as teacher_id
       FROM discussion_posts p
       JOIN discussion_threads t ON p.thread_id = t.id
       JOIN lectures l ON t.lecture_id = l.id
       LEFT JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE p.id = $1`,
      [postId]
    );

    if (postCheck.rows.length === 0) return res.status(404).json({ error: 'Bài viết không tồn tại' });
    
    const post = postCheck.rows[0];
    
    // Chỉ cho phép sửa nếu là tác giả hoặc là giáo viên khóa học
    if (post.author_id !== userId && post.teacher_id !== userId) {
       return res.status(403).json({ error: 'Bạn không có quyền sửa bài viết này.' });
    }

    const updatedPost = await db.query(
      "UPDATE discussion_posts SET body = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [body, postId]
    );

    res.status(200).json(updatedPost.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

exports.closeThread = async (req, res) => {
  try {
    const { id: threadId } = req.params;
    const userId = req.user.userId;

    // Kiểm tra quyền: Phải là Giáo viên của khóa học
    const threadCheck = await db.query(
      `SELECT ci.user_id 
       FROM discussion_threads t
       JOIN lectures l ON t.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE t.id = $1 AND ci.user_id = $2`,
      [threadId, userId]
    );

    if (threadCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Chỉ giáo viên mới được đóng thread.' });
    }

    const result = await db.query(
      "UPDATE discussion_threads SET closed_at = NOW() WHERE id = $1 RETURNING *",
      [threadId]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};