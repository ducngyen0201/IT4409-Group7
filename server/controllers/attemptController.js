const db = require('../db');

exports.startAttempt = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const studentId = req.user.userId;

    // 1. LẤY THÔNG TIN QUIZ
    const quizQuery = await db.query(
      "SELECT * FROM quizzes WHERE id = $1 AND is_published = true",
      [quizId]
    );

    if (quizQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra.' });
    }
    const quiz = quizQuery.rows[0];

    // 2. KIỂM TRA HẠN CHÓT (DUE DATE)
    if (quiz.due_at && new Date() > new Date(quiz.due_at)) {
      return res.status(400).json({ error: 'Đã quá hạn làm bài kiểm tra này.' });
    }

    // 3. KIỂM TRA SỐ LẦN LÀM BÀI
    const attemptsCount = await db.query(
      "SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2",
      [quizId, studentId]
    );
    const currentAttempts = parseInt(attemptsCount.rows[0].count);

    if (quiz.attempts_allowed && currentAttempts >= quiz.attempts_allowed) {
      return res.status(400).json({ 
        error: `Bạn đã hết lượt làm bài (Tối đa: ${quiz.attempts_allowed} lượt).` 
      });
    }

    // 4. TÍNH TỔNG ĐIỂM (MAX SCORE) CỦA ĐỀ
    const pointsQuery = await db.query(
      "SELECT SUM(points) as total FROM questions WHERE quiz_id = $1",
      [quizId]
    );
    const maxScore = pointsQuery.rows[0].total || 0;

    // 5. TẠO LẦN LÀM BÀI MỚI
    const newAttempt = await db.query(
      `INSERT INTO quiz_attempts 
       (quiz_id, student_id, status, started_at, max_score)
       VALUES ($1, $2, 'IN_PROGRESS', NOW(), $3)
       RETURNING *`,
      [quizId, studentId, maxScore]
    );

    // 6. LẤY ĐỀ BÀI (CÂU HỎI + LỰA CHỌN)
    const questionsQuery = await db.query(
      `SELECT id, type, prompt, points, position 
       FROM questions 
       WHERE quiz_id = $1 
       ORDER BY position ASC`,
      [quizId]
    );
    let questions = questionsQuery.rows;

    // Lấy options cho từng câu hỏi
    for (let q of questions) {
      const optionsQuery = await db.query(
        `SELECT id, content, position 
         FROM options 
         WHERE question_id = $1 
         ORDER BY position ASC`,
        [q.id]
      );
      q.options = optionsQuery.rows; // Gắn options vào câu hỏi
    }

    // 7. XÁO TRỘN CÂU HỎI
    if (quiz.shuffle_questions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // 8. Trả về: Thông tin lần làm bài + Danh sách câu hỏi (đã ẩn đáp án đúng)
    res.status(201).json({
      attempt: newAttempt.rows[0],
      questions: questions
    });

  } catch (err) {
    console.error("Lỗi khi bắt đầu làm bài:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { id: attemptId } = req.params;
    const studentId = req.user.userId;
    const { question_id, selected_option_id } = req.body;

    // 1. KIỂM TRA LƯỢT LÀM BÀI (Attempt)
    const attemptQuery = await db.query(
      "SELECT * FROM quiz_attempts WHERE id = $1 AND student_id = $2",
      [attemptId, studentId]
    );

    if (attemptQuery.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập lượt làm bài này.' });
    }

    const attempt = attemptQuery.rows[0];
    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Bài làm này đã nộp hoặc đã kết thúc.' });
    }

    // --- ĐOẠN CODE BẢO MẬT MỚI ---
    // 2. KIỂM TRA CÂU HỎI: Câu hỏi này có thuộc về Quiz đang làm không?
    // Logic: Join bảng 'questions' với 'quiz_attempts' thông qua 'quiz_id'
    const validQuestionCheck = await db.query(
      `SELECT q.id 
       FROM questions q
       JOIN quiz_attempts qa ON q.quiz_id = qa.quiz_id
       WHERE q.id = $1 AND qa.id = $2`,
      [question_id, attemptId]
    );

    if (validQuestionCheck.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Câu hỏi này không thuộc bài kiểm tra bạn đang làm.' 
      });
    }

    // 3. LƯU ĐÁP ÁN (UPSERT)
    const savedAnswer = await db.query(
      `INSERT INTO attempt_answers (attempt_id, question_id, selected_option_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (attempt_id, question_id) 
       DO UPDATE SET selected_option_id = EXCLUDED.selected_option_id
       RETURNING *`,
      [attemptId, question_id, selected_option_id]
    );

    res.status(200).json(savedAnswer.rows[0]);

  } catch (err) {
    console.error("Lỗi khi gửi đáp án:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.submitAttempt = async (req, res) => {
  const client = await db.getClient();

  try {
    const { id: attemptId } = req.params;
    const studentId = req.user.userId;

    await client.query('BEGIN');

    // 1. KIỂM TRA LƯỢT LÀM BÀI
    // Phải tồn tại, đúng học sinh, và đang 'IN_PROGRESS'
    const attemptQuery = await client.query(
      "SELECT * FROM quiz_attempts WHERE id = $1 AND student_id = $2",
      [attemptId, studentId]
    );

    if (attemptQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Không tìm thấy bài làm.' });
    }
    const attempt = attemptQuery.rows[0];

    if (attempt.status !== 'IN_PROGRESS') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Bài làm này đã được nộp trước đó.' });
    }

    // 2. LẤY "ĐÁP ÁN ĐÚNG" CỦA ĐỀ THI
    const answerKeyQuery = await client.query(
      `SELECT q.id as question_id, q.points, o.id as correct_option_id
       FROM questions q
       JOIN options o ON q.id = o.question_id
       WHERE q.quiz_id = $1 AND o.is_correct = true`,
      [attempt.quiz_id]
    );
    
    const answerKeyMap = {};
    answerKeyQuery.rows.forEach(row => {
      answerKeyMap[row.question_id] = {
        points: Number(row.points),
        correct_option_id: row.correct_option_id
      };
    });

    // 3. LẤY BÀI LÀM CỦA HỌC SINH
    const userAnswersQuery = await client.query(
      "SELECT * FROM attempt_answers WHERE attempt_id = $1",
      [attemptId]
    );
    const userAnswers = userAnswersQuery.rows;

    // 4. CHẤM ĐIỂM (Tính toán)
    let totalScore = 0;

    // Duyệt qua từng câu trả lời của học sinh
    for (const ans of userAnswers) {
      const key = answerKeyMap[ans.question_id];
      
      // Mặc định là sai
      let isCorrect = false;
      let pointsAwarded = 0;

      if (key) {
        // So sánh đáp án học sinh chọn với đáp án đúng
        if (String(ans.selected_option_id) === String(key.correct_option_id)) {
          isCorrect = true;
          pointsAwarded = key.points;
        }
      }

      // Cộng dồn tổng điểm
      totalScore += pointsAwarded;

      // Cập nhật lại bảng 'attempt_answers' để lưu kết quả từng câu (Đúng/Sai, Điểm đạt được)
      await client.query(
        `UPDATE attempt_answers 
         SET is_correct = $1, points_awarded = $2
         WHERE id = $3`,
        [isCorrect, pointsAwarded, ans.id]
      );
    }

    // 5. CẬP NHẬT TRẠNG THÁI BÀI THI (SUBMITTED) VÀ TỔNG ĐIỂM
    const updatedAttempt = await client.query(
      `UPDATE quiz_attempts
       SET status = 'SUBMITTED', 
           submitted_at = NOW(), 
           score = $1
       WHERE id = $2
       RETURNING *`,
      [totalScore, attemptId]
    );

    await client.query('COMMIT'); // --- LƯU THÀNH CÔNG ---

    res.status(200).json({
      message: "Nộp bài thành công!",
      result: updatedAttempt.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK'); // --- CÓ LỖI, HỦY HẾT ---
    console.error("Lỗi khi nộp bài:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  } finally {
    client.release(); // Trả client về pool
  }
};

exports.getAttemptDetails = async (req, res) => {
  try {
    const { id: attemptId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 1. Lấy thông tin Attempt
    const attemptQuery = await db.query(
      "SELECT * FROM quiz_attempts WHERE id = $1",
      [attemptId]
    );

    if (attemptQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bài làm.' });
    }
    const attempt = attemptQuery.rows[0];

    // 2. Kiểm tra quyền xem:
    // - Học sinh: Chỉ xem được bài của chính mình.
    
    if (attempt.student_id !== userId && userRole !== 'ADMIN') {
        // Check thêm nếu là TEACHER của khóa học này
        return res.status(403).json({ error: 'Bạn không có quyền xem bài làm này.' });
    }

    // 3. Lấy danh sách câu trả lời (Kèm nội dung câu hỏi và đáp án đã chọn)
    const answersQuery = await db.query(
      `SELECT 
          aa.id, aa.question_id, aa.selected_option_id, 
          q.prompt as question_prompt, q.points as question_points,
          o.content as selected_option_content,
          aa.is_correct, aa.points_awarded
       FROM attempt_answers aa
       JOIN questions q ON aa.question_id = q.id
       LEFT JOIN options o ON aa.selected_option_id = o.id
       WHERE aa.attempt_id = $1
       ORDER BY q.position ASC`,
      [attemptId]
    );

    const result = {
      attempt: attempt,
      answers: answersQuery.rows
    };

    // 4. LOGIC HIỂN THỊ:
    if (attempt.status === 'IN_PROGRESS') {
      result.answers = result.answers.map(ans => ({
        ...ans,
        is_correct: undefined,    // Ẩn
        points_awarded: undefined // Ẩn
      }));
      result.attempt.score = undefined; // Ẩn điểm tạm tính (nếu có)
    }

    res.status(200).json(result);

  } catch (err) {
    console.error("Lỗi xem chi tiết attempt:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};