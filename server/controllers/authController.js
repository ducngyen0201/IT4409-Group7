const db = require('../db'); // File kết nối database
const bcrypt = require('bcrypt'); // Thư viện mã hóa
const jwt = require('jsonwebtoken'); // Thư viện tạo và xác thực JWT

exports.register = async (req, res) => {
  try {
    // 1. Lấy thêm trường role từ req.body
    const { email, password, full_name, role } = req.body;

    // 2. Kiểm tra dữ liệu đầu vào cơ bản
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin." });
    }

    // 3. Kiểm tra xem email đã tồn tại chưa
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(401).json({ error: "Email đã tồn tại." });
    }

    // 4. Xử lý logic Role (Quan trọng để bảo mật)
    const validRoles = ['STUDENT', 'TEACHER'];
    // Nếu role gửi lên không hợp lệ hoặc trống, mặc định là STUDENT
    const userRole = validRoles.includes(role) ? role : 'STUDENT';

    // 5. Mã hóa (hash) mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Thêm người dùng mới vào database (Bổ sung cột role)
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, full_name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name, role`,
      [email, hashedPassword, full_name, userRole]
    );

    // 7. Trả về thông báo thành công
    res.status(201).json({ 
      message: "Đăng ký thành công!",
      user: newUser.rows[0] 
    });

  } catch (err) {
    console.error("Lỗi khi đăng ký:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.login = async (req, res) => {
  try {
    // 1. Lấy email và password từ client
    const { email, password } = req.body;

    // 2. Kiểm tra email có tồn tại trong database không
    const userQuery = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "Email hoặc mật khẩu không đúng." });
    }

    const user = userQuery.rows[0];

    // 3. So sánh mật khẩu client gửi với mật khẩu (đã hash) trong database
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
    }

    // 4. Nếu mật khẩu đúng -> TẠO TOKEN
    // Chúng ta sẽ mã hóa userId và role vào token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Token hết hạn sau 24 giờ
    );

    // 5. Gửi token về cho client
    res.status(200).json({
      message: "Đăng nhập thành công!",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Lỗi khi đăng nhập:", err.message);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

exports.forgotPasswordCheck = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await db.query("SELECT id FROM users WHERE email = $1", [email]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Email không tồn tại." });
        }
        
        res.status(200).json({ exists: true });
    } catch (err) {
        res.status(500).json({ error: "Lỗi máy chủ" });
    }
};

// Bước 2: Cập nhật mật khẩu mới (không cần token xác thực)
exports.resetPasswordQuick = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(newPassword, salt);
        
        await db.query(
            "UPDATE users SET password_hash = $1 WHERE email = $2",
            [hashedPass, email]
        );
        
        res.status(200).json({ message: "Mật khẩu đã được cập nhật." });
    } catch (err) {
        res.status(500).json({ error: "Lỗi khi cập nhật mật khẩu" });
    }
};