const express = require('express');
const path = require('path');
const multer = require('multer');
const { randomUUID } = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const adminAuth = require('../middleware/adminAuth');

const diskStorage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, path.join(__dirname, '..', 'uploads')),
    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    }
});
const useS3 = Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_REGION);
const upload = multer({
    storage: useS3 ? multer.memoryStorage() : diskStorage,
    limits: { fileSize: 5 * 1024 * 1024, files: 6 },
    fileFilter: (_req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
});

const router = express.Router();
router.post('/', adminAuth, upload.array('images', 6), async (req, res) => {
    if (useS3) {
        const s3 = new S3Client({ region: process.env.AWS_REGION });
        const images = await Promise.all(req.files.map(async (file) => {
            const key = `products/${randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
            await s3.send(new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key, Body: file.buffer, ContentType: file.mimetype }));
            const baseUrl = process.env.AWS_CDN_URL || `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
            return `${baseUrl.replace(/\/$/, '')}/${key}`;
        }));
        return res.status(201).json({ images });
    }
    const origin = `${req.protocol}://${req.get('host')}`;
    return res.status(201).json({ images: req.files.map((file) => `${origin}/uploads/${file.filename}`) });
});

module.exports = router;
