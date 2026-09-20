const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const { getCustomerRecords } = require('../controller/customerRecordsController');
router.get('/', adminAuth, getCustomerRecords);
module.exports = router;
