const express = require('express');
const {
    createEnquiry,
    getEnquiries,
    updateEnquiry,
    deleteEnquiry
} = require('../controller/enquiryController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();
router.post('/', createEnquiry);
router.get('/', adminAuth, getEnquiries);
router.put('/:id', adminAuth, updateEnquiry);
router.delete('/:id', adminAuth, deleteEnquiry);
module.exports = router;
