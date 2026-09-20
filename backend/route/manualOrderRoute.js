const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const {
    getManualOrders,
    saveManualOrder,
    deleteManualOrder
} = require('../controller/manualOrderController');

router.use(adminAuth);
router.get('/', getManualOrders);
router.post('/', saveManualOrder);
router.patch('/:id', saveManualOrder);
router.delete('/:id', deleteManualOrder);

module.exports = router;
