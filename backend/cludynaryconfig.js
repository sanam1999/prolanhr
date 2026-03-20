const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDNAME,
    api_key: process.env.APIKEY,
    api_secret: process.env.APISECRE,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        // ✅ Add max file size (5MB)
        max_file_size: 5242880, // 5MB in bytes
        // ✅ Add public_id for consistent naming
        public_id: (req, file) => {
            // Generate unique name: userid-timestamp-randomstring
            return `${req.params.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    }
});

// ✅ Create upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = {
    storage,
    cloudinary,
    upload, // ✅ Export upload middleware
};