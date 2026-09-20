const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const customerAuth = require('../middleware/customerAuth');
const optionalCustomerAuth = require('../middleware/optionalCustomerAuth');
const adminAuth = require('../middleware/adminAuth');
const {
    createOrder,
    getMyOrders,
    getGuestOrder,
    getAllOrders,
    updateOrder
} = require('../controller/orderController');
const { sendQuote, getQuote, acceptQuote } = require('../controller/quoteController');
router.post(
    '/',
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-8',
        legacyHeaders: false
    }),
    optionalCustomerAuth,
    createOrder
);
router.get('/mine', customerAuth, getMyOrders);
router.get('/guest/:id', getGuestOrder);
router.get('/:id/quote', optionalCustomerAuth, getQuote);
router.post('/:id/quote/accept', optionalCustomerAuth, acceptQuote);
router.get('/', adminAuth, getAllOrders);
router.post('/:id/quote', adminAuth, sendQuote);
router.patch('/:id', adminAuth, updateOrder);
module.exports = router;
