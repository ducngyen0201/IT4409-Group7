const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // 1. Xác định Resource Type (video, image, hoặc raw cho tài liệu)
    let resourceType = 'auto';
    if (file.mimetype.includes('pdf') || file.mimetype.includes('word') || file.mimetype.includes('officedocument')) {
      resourceType = 'raw';
    }

    // 2. Xác định Folder dựa trên route hoặc body
    let folderPath = 'elearning/general';
    
    if (req.baseUrl.includes('user') || req.path.includes('avatar')) {
      folderPath = 'elearning/avatars';
    } else if (req.params.id || req.body.lectureId) {
      const id = req.params.id || req.body.lectureId;
      folderPath = `elearning/lectures/lecture_${id}`;
    }

    return {
      folder: folderPath,
      resource_type: resourceType,
      public_id: `${Date.now()}_${file.originalname.split('.')[0]}`,
    };
  },
});

const uploadCloud = multer({ storage });
module.exports = uploadCloud;