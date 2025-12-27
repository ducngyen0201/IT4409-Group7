const db = require('../db');
const cloudinary = require('cloudinary').v2;
const fs = require('fs'); // Thêm thư viện File System để xóa file tạm

// 1. API UPLOAD TÀI LIỆU
exports.uploadMaterial = async (req, res) => {
  try {
    const { id: lecture_id } = req.params; 
    const { title, type } = req.body;
    
    if (!req.file) return res.status(400).json({ error: 'Không nhận được file.' });

    // Với CloudinaryStorage:
    const fileUrl = req.file.path;       // Đây đã là link https://res.cloudinary...
    const storageKey = req.file.filename; // Đây là Public ID trên Cloud
    const sizeBytes = req.file.size;

    const queryText = `
      INSERT INTO materials (lecture_id, title, type, storage_key, size_bytes)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    // Lưu fileUrl vào storage_key để frontend dễ lấy
    const values = [lecture_id, title, type, fileUrl, sizeBytes];

    const newMaterial = await db.query(queryText, values);
    
    // KHÔNG CẦN fs.unlinkSync vì không có file ở local
    res.status(201).json(newMaterial.rows[0]);

  } catch (err) {
    console.error("Lỗi:", err.message);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

// 2. API XÓA TÀI LIỆU (Cải tiến logic lấy Public ID)
exports.deleteMaterial = async (req, res) => {
  try {
    const { id: materialId } = req.params;
    const userId = req.user.userId; // Khớp với authMiddleware

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
    const fileUrl = material.storage_key; // Đây là URL đầy đủ

    // --- LOGIC XÓA FILE TRÊN CLOUDINARY ---
    if (fileUrl && fileUrl.startsWith('http')) {
      try {
        // Tách Public ID từ URL Cloudinary
        const parts = fileUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
        const publicId = publicIdWithExt.split('.')[0];

        // Xác định resource_type
        let resourceType = 'raw'; // Mặc định cho PDF, Docx, Zip
        if (fileUrl.includes('/video/')) resourceType = 'video';
        if (fileUrl.includes('/image/')) resourceType = 'image';

        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log("Đã xóa trên Cloudinary:", publicId);
      } catch (cloudErr) {
        console.error("Lỗi xóa Cloudinary:", cloudErr.message);
      }
    }

    await db.query("DELETE FROM materials WHERE id = $1", [materialId]);
    res.status(200).json({ message: 'Xóa thành công.' });

  } catch (err) {
    res.status(500).json({ error: "Lỗi Server" });
  }
};

// 3. API CẬP NHẬT TÊN TÀI LIỆU
exports.updateMaterial = async (req, res) => {
  try {
    const { id: materialId } = req.params;
    const userId = req.user.userId; // Khớp với authMiddleware
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
    res.status(500).json({ error: "Lỗi Server" });
  }
};