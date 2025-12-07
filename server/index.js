require('dotenv').config();

// ----- 1. IMPORT CÁC THƯ VIỆN -----
const express = require('express');
const cors = require('cors');
const db = require('./db'); 

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const meRoutes = require('./routes/meRoutes');
const quizRoutes = require('./routes/quizRoutes');
const questionRoutes = require('./routes/questionRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const systemRoutes = require('./routes/systemRoutes');
const materialRoutes = require('./routes/materialRoutes');
const optionRoutes = require('./routes/optionRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ----- 2. SỬ DỤNG MIDDLEWARE -----
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ----- 3. TẠO ROUTE ĐỂ KIỂM TRA (TEST) -----
// API endpoint này dùng để kiểm tra xem kết nối có thành công không
app.get('/api/test', async (req, res) => {
  try {
    // Sử dụng hàm 'query' từ db.js để gửi lệnh SQL
    const { rows } = await db.query('SELECT NOW();');
    
    // Nếu thành công, trả về ngày giờ hiện tại từ database
    res.json({ message: 'Kết nối database thành công!', time: rows[0].now });
  } catch (err) {
    console.error('Lỗi kết nối database:', err.message);
    res.status(500).json({ error: 'Không thể kết nối đến database.' });
  }
});

// ----- 4. SỬ DỤNG CÁC ROUTE -----
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/me', meRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/threads', discussionRoutes);
app.use('/api', systemRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/options', optionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);

// ----- 5. KHỞI CHẠY SERVER -----
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});