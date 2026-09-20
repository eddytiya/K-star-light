const express = require('express');
const {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory
} = require('../controller/categoryController');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();
router.use(adminAuth);

router.route('/').post(createCategory).get(getCategories);
router.route('/:id').get(getCategory).put(updateCategory).delete(deleteCategory);

module.exports = router;
