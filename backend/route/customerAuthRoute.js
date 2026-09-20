const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const customerAuth = require('../middleware/customerAuth');
const {
    register,
    login,
    googleLogin,
    linkGoogle,
    requestEmailVerification,
    confirmEmailVerification,
    me
} = require('../controller/customerAuthController');
const verificationLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false
});
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/google/link', customerAuth, linkGoogle);
router.get('/me', customerAuth, me);
router.post('/verify-email/request', customerAuth, verificationLimit, requestEmailVerification);
router.post('/verify-email/confirm', customerAuth, verificationLimit, confirmEmailVerification);
module.exports = router;
