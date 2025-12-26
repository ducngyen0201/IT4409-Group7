const db = require('../db');
const cloudinary = require('cloudinary').v2; // Cần để thực hiện lệnh xóa file trên Cloud

// 1. API UPLOAD TÀI LIỆU
exports.uploadMaterial = async (req, res) => {
  try {
    const { id: lecture_id } = req.params; 
    const { title, type } = req.body;
    
    if (!req.file) return res.status(400).json({ error: 'Không nhận được file từ Cloudinary.' });

    const storageKey = req.file.filename; // Public ID từ Cloudinary
    const sizeBytes = req.file.size;
    const fileUrl = req.file.path; // Nếu bạn muốn dùng link này thay cho storage_key

    console.log("Dữ liệu chuẩn bị INSERT:", { lecture_id, title, type, storageKey, sizeBytes });

    // CÂU LỆNH SQL: Đã loại bỏ hoàn toàn cột 'url'
    const queryText = `
      INSERT INTO materials (lecture_id, title, type, storage_key, size_bytes)
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    const values = [lecture_id, title, type, storageKey, sizeBytes];

    const newMaterial = await db.query(queryText, values);
    res.status(201).json(newMaterial.rows[0]);

  } catch (err) {
    // IN LỖI CHI TIẾT RA TERMINAL
    console.error("--- LỖI DATABASE CHI TIẾT ---");
    console.error("Mã lỗi (Code):", err.code);
    console.error("Nội dung lỗi:", err.message);

    // TRẢ LỖI CHI TIẾT VỀ FRONTEND ĐỂ BẠN ĐỌC ĐƯỢC
    res.status(500).json({ 
      error: "Lỗi thực thi SQL", 
      message: err.message, // Ví dụ: "invalid input value for enum..."
      detail: err.detail    // Ví dụ: "Key (lecture_id)=(1) is not present in table..."
    });
  }
};

// 2. API XÓA TÀI LIỆU
exports.deleteMaterial = async (req, res) => {
  try {
    const { id: materialId } = req.params;
    const userId = req.user.userId;

    const checkOwner = await db.query(
      `SELECT m.id, m.storage_key, m.type FROM materials m
       JOIN lectures l ON m.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE m.id = $1 AND ci.user_id = $2`,
      [materialId, userId]
    );

    if (checkOwner.rows.length === 0) {
      return res.status(403).json({ error: 'Không có quyền hoặc tài liệu không tồn tại.' });
    }

    const material = checkOwner.rows[0];
    const fileUrl = material.storage_key;

    // --- LOGIC XÓA FILE TRÊN CLOUDINARY ---
    if (fileUrl && fileUrl.includes('cloudinary.com')) {
      try {
        const parts = fileUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        
        // Lấy toàn bộ đường dẫn từ sau version đến trước phần mở rộng
        // Ví dụ: "elearning/lectures/lecture_10/file_name"
        const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
        const publicId = publicIdWithExt.split('.')[0];

        // Xác định resource_type (video cần khai báo riêng)
        let resourceType = 'image'; 
        if (fileUrl.includes('/video/')) resourceType = 'video';
        if (material.type !== 'VIDEO' && material.type !== 'IMAGE') resourceType = 'raw';

        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log("Đã xóa file trên Cloudinary:", publicId);
      } catch (cloudErr) {
        console.error("Lỗi xóa file Cloudinary:", cloudErr.message);
      }
    }

    await db.query("DELETE FROM materials WHERE id = $1", [materialId]);
    res.status(200).json({ message: 'Xóa thành công.' });

  } catch (err) {
    res.status(500).json({ error: "Lỗi Server" });
  }
};

// 3. API CẬP NHẬT TÊN TÀI LIỆU (Giữ nguyên vì chỉ sửa Title)
exports.updateMaterial = async (req, res) => {
  try {
    const { id: materialId } = req.params;
    const userId = req.user.userId;
    const { title } = req.body;

    const checkOwner = await db.query(
      `SELECT m.id FROM materials m
       JOIN lectures l ON m.lecture_id = l.id
       JOIN course_instructors ci ON l.course_id = ci.course_id
       WHERE m.id = $1 AND ci.user_id = $2`,
      [materialId, userId]
    );

    if (checkOwner.rows.length === 0) {
      return res.status(403).json({ error: 'Không có quyền sửa.' });
    }

    const updatedMaterial = await db.query(
      "UPDATE materials SET title = $1 WHERE id = $2 RETURNING *",
      [title, materialId]
    );

    res.status(200).json(updatedMaterial.rows[0]);
  } catch (err) {
    console.error("Lỗi sửa tài liệu:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};