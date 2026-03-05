const path = require('path');
const aiService = require('../services/aiService');

// In-memory store for uploaded image paths
let uploadedImages = [];

/**
 * POST /upload
 * Handles multi-image uploads via multer, then automatically triggers AI processing.
 */
const uploadImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No image files uploaded.' });
        }

        // Build accessible paths
        const imagePaths = req.files.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            url: `http://localhost:${process.env.PORT || 5000}/static/${file.filename}`,
        }));

        // Accumulate uploaded images in memory
        uploadedImages = [...uploadedImages, ...imagePaths];

        console.log(`[UPLOAD] ${req.files.length} image(s) received. Total: ${uploadedImages.length}`);

        // Automatically trigger AI processing after upload
        const filePaths = uploadedImages.map((img) => img.path);
        const clusters = await aiService.processImages(filePaths);

        res.status(200).json({
            message: `${req.files.length} image(s) uploaded successfully.`,
            uploaded: imagePaths,
            clusters,
        });
    } catch (error) {
        console.error('[UPLOAD ERROR]', error.message);
        next(error);
    }
};

/**
 * POST /process-images
 * Manually triggers image processing via the AI service using currently uploaded images.
 */
const processImages = async (req, res, next) => {
    try {
        // Allow passing explicit image paths in body, or use in-memory store
        const imagePaths = req.body.images || uploadedImages.map((img) => img.path);

        if (!imagePaths || imagePaths.length === 0) {
            return res.status(400).json({ error: 'No images to process. Upload images first.' });
        }

        const clusters = await aiService.processImages(imagePaths);

        res.status(200).json({ clusters });
    } catch (error) {
        console.error('[PROCESS ERROR]', error.message);
        next(error);
    }
};

/**
 * Exposes the current uploaded images list (used by cluster controller).
 */
const getUploadedImages = () => uploadedImages;

module.exports = { uploadImages, processImages, getUploadedImages };
