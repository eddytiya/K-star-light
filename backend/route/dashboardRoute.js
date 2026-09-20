const express = require('express');
const { getDashboard } = require('../controller/dashboardController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();
router.get('/', adminAuth, getDashboard);
module.exports = router;
