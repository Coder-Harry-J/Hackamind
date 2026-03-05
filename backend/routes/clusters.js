const express = require('express');
const router = express.Router();
const clusterController = require('../controllers/clusterController');

// GET /clusters — retrieve all current cluster results
router.get('/clusters', clusterController.getClusters);

module.exports = router;
