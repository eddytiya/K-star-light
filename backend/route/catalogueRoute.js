const express = require('express');
const {
    getCatalogue,
    getCatalogueProduct,
    getCatalogueFilters
} = require('../controller/catalogueController');

const router = express.Router();

router.get('/', getCatalogue);
router.get('/filters', getCatalogueFilters);
router.get('/:slug', getCatalogueProduct);

module.exports = router;
