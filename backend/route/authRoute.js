const express = require('express');
const { login, me } = require('../controller/authController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();
router.post('/login', login);
router.get('/me', adminAuth, me);
module.exports = router;
