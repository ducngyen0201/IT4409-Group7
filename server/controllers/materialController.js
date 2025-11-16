const db = require('../db');

exports.uploadMaterial = async (req, res) => {
  try {
    // 1. Lấy thông tin từ client (form-data)
    const { lecture_id, title, type } = req.body;
    
    // 2. Kiểm tra file (từ multer)
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file nào được tải lên.' });
    }

    // 3. Lấy đường dẫn (path) của file đã lưu trên server
    const storageKey = req.file.path; 

    // 4. Lấy kích thước file (bytes)
    const sizeBytes = req.file.size;

    // 5. Kiểm tra xem 'type' (VIDEO, PDF,...) có được gửi lên không
    if (!type) {
        return res.status(400).json({ error: 'Cột "type" (loại tài liệu) là bắt buộc.' });
    }

    // 6. Thêm thông tin vào bảng 'materials'
    const newMaterial = await db.query(
      `INSERT INTO materials (lecture_id, title, type, storage_key, size_bytes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [lecture_id, title, type, storageKey, sizeBytes]
    );

    res.status(201).json(newMaterial.rows[0]);

  } catch (err) {
    console.error("Lỗi khi upload tài liệu:", err.message);
    
    // Kiểm tra xem có phải lỗi do 'lecture_id' không tồn tại không
    if (err.code === '23503') { // Lỗi foreign key
        return res.status(400).json({ error: 'lecture_id (ID bài giảng) không tồn tại.' });
    }
    
    res.status(500).json({ error: "Lỗi máy chủ nội bộ", details: err.message });
  }
};