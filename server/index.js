require('dotenv').config();

// ----- 1. IMPORT CÁC THƯ VIỆN -----
const express = require('express');
const http = require('http');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const { Server } = require("socket.io");

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

// ----- 2. CẤU HÌNH MIDDLEWARE -----
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true 
}));

app.use(express.json());
app.use('/uploads', express.static('uploads')); 

// ----- 3. TẠO ROUTE ĐỂ KIỂM TRA -----
app.get('/api/test', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT NOW();');
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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Đã xảy ra lỗi hệ thống!', 
    details: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);

// 2. Khởi tạo Socket.io
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // URL frontend của bạn
        methods: ["GET", "POST"]
    }
});

// 3. Xử lý logic Socket
io.on("connection", (socket) => {
    // Gửi ID của chính socket đó về cho client vừa kết nối
    socket.emit("me", socket.id);

    // Khi ngắt kết nối
    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded");
    });

    // --- LOGIC GỌI VIDEO ---
    
    // A gọi cho B: A gửi tín hiệu (signalData) lên server để chuyển cho B
    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", { 
            signal: data.signalData, 
            from: data.from, 
            name: data.name 
        });
    });

    // B trả lời A: B gửi tín hiệu chấp nhận
    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });
});

// ----- 5. KHỞI CHẠY SERVER -----
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));