const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const { getProductEnquiries } = require('../controller/reportController');
router.get('/product-enquiries', adminAuth, getProductEnquiries);
module.exports = router;
