const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Sends image file paths to the FastAPI AI service for embedding + clustering.
 * @param {string[]} imagePaths - Array of absolute or relative file paths
 * @returns {Promise<string[][]>} - Array of clusters, each cluster is an array of image paths
 */
const processImages = async (imagePaths) => {
    try {
        console.log(`[AI SERVICE] Sending ${imagePaths.length} image(s) to ${AI_SERVICE_URL}/process-images`);

        const response = await axios.post(
            `${AI_SERVICE_URL}/process-images`,
            { images: imagePaths },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000, // 2-minute timeout (CLIP model can be slow on first load)
            }
        );

        const { clusters } = response.data;

        if (!Array.isArray(clusters)) {
            throw new Error('AI service returned an unexpected response format.');
        }

        console.log(`[AI SERVICE] Received ${clusters.length} cluster(s).`);
        return clusters;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error(
                'AI service is not running. Please start the FastAPI service on port 8000.'
            );
        }
        if (error.response) {
            throw new Error(
                `AI service error ${error.response.status}: ${JSON.stringify(error.response.data)}`
            );
        }
        throw error;
    }
};

module.exports = { processImages };
