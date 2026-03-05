const aiService = require('../services/aiService');
const { getUploadedImages } = require('./uploadController');

/**
 * GET /clusters
 * Returns last known cluster results, re-processing if needed.
 */
const getClusters = async (req, res, next) => {
    try {
        const uploadedImages = getUploadedImages();

        if (!uploadedImages || uploadedImages.length === 0) {
            return res.status(200).json({
                message: 'No images uploaded yet.',
                clusters: [],
            });
        }

        const filePaths = uploadedImages.map((img) => img.path);
        const clusters = await aiService.processImages(filePaths);

        // Enrich clusters with full image metadata
        const enrichedClusters = clusters.map((cluster, idx) => ({
            clusterId: idx,
            label: `Product Group ${idx + 1}`,
            images: cluster.map((filePath) => {
                const imgMeta = uploadedImages.find((img) => img.path === filePath || img.filename === filePath);
                return imgMeta || { path: filePath, url: filePath };
            }),
        }));

        res.status(200).json({
            totalImages: uploadedImages.length,
            totalClusters: enrichedClusters.length,
            clusters: enrichedClusters,
        });
    } catch (error) {
        console.error('[CLUSTERS ERROR]', error.message);
        next(error);
    }
};

module.exports = { getClusters };
