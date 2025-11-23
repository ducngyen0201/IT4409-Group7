const db = require('../db');
const fs = require('fs');
const path = require('path');

exports.uploadMaterial = async (req, res) => {
  try {
    // 1. Lấy 'id' từ URL và đổi tên thành 'lecture_id'
    const { id: lecture_id } = req.params; 
    const { title, type } = req.body;
    
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

exports.deleteMaterial = async (req, res) => {
  try {
    const { id: materialId } = req.params;
    const userId = req.user.userId;

    // 1. KIỂM TRA QUYỀN SỞ HỮU VÀ LẤY THÔNG TIN FILE
    const checkOwner = await db.query(
      `SELECT m.id, m.storage_key 
       FROM materials m
       JOIN lectures l ON m.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE m.id = $1 AND ci.user_id = $2`,
      [materialId, userId]
    );

    if (checkOwner.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa tài liệu này hoặc tài liệu không tồn tại.' });
    }

    const material = checkOwner.rows[0];
    const filePath = material.storage_key;

    // 2. XÓA FILE VẬT LÝ (LOCAL STORAGE)
    // Kiểm tra xem filePath có tồn tại trong DB không
    if (filePath) {
      const absolutePath = path.join(process.cwd(), filePath);

      // Kiểm tra file có tồn tại trên ổ cứng không trước khi xóa
      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
          console.log(`Đã xóa file: ${absolutePath}`);
        } catch (fileErr) {
          console.error("Lỗi khi xóa file vật lý:", fileErr.message);
        }
      } else {
        console.warn("File không tồn tại trên ổ cứng:", absolutePath);
      }
    }

    // 3. XÓA TRONG DATABASE
    await db.query("DELETE FROM materials WHERE id = $1", [materialId]);

    res.status(200).json({ message: 'Đã xóa tài liệu và file thành công.' });

  } catch (err) {
    console.error("Lỗi xóa tài liệu:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};