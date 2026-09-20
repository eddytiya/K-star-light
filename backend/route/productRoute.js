const express = require('express');
const {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    adjustStock,
    deleteProduct
} = require('../controller/productController');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();
router.use(adminAuth);

router.route('/').post(createProduct).get(getProducts);

router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);
router.put('/:id/stock', adjustStock);

module.exports = router;
