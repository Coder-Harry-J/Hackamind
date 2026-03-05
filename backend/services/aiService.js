const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Sends image file paths to the FastAPI AI service for processing.
 * @param {string[]} imagePaths - Array of absolute or relative file paths
 * @param {string[]} [productTitles] - Optional product title strings
 * @returns {Promise<object>} - Catalog JSON with .products array
 */
const processImages = async (imagePaths, productTitles = []) => {
    try {
        console.log(`[AI SERVICE] Sending ${imagePaths.length} image(s) to ${AI_SERVICE_URL}/process-catalog`);

        const response = await axios.post(
            `${AI_SERVICE_URL}/process-catalog`,
            { images: imagePaths, product_titles: productTitles },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000,
            }
        );

        const { products } = response.data;

        if (!Array.isArray(products)) {
            throw new Error('AI service returned an unexpected response format.');
        }

        console.log(`[AI SERVICE] Received ${products.length} product(s).`);
        return response.data;
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
