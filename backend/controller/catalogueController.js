const mongoose = require('mongoose');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const publicProduct = (product) => {
    const item = product.toObject ? product.toObject({ virtuals: false }) : { ...product };
    item.stockStatus = item.stockQuantity > 0 ? 'In Stock' : 'Out of Stock';
    delete item.stockQuantity;
    delete item.lowStockThreshold;
    delete item.inventoryHistory;
    delete item.__v;
    return item;
};

const getCatalogue = async (req, res) => {
    try {
        const query = { status: 'published' };
        const { q, category, wattage, colour, usage, fitting, brightness, minPrice, maxPrice, featured } = req.query;

        if (q?.trim()) {
            const search = new RegExp(escapeRegex(q.trim()), 'i');
            query.$or = [{ name: search }, { brand: search }];
        }
        if (category) {
            if (!mongoose.isValidObjectId(category)) {
                return res.status(400).json({ message: 'Invalid category filter' });
            }
            query.category = category;
        }
        if (wattage) query.wattage = wattage;
        if (colour) query.lightColour = colour;
        if (usage) query.usage = usage;
        if (fitting) query.fittingType = fitting;
        if (brightness) query.brightness = brightness;
        if (featured === 'true') query.featured = true;

        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
            if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
            if (Object.values(query.price).some(Number.isNaN)) {
                return res.status(400).json({ message: 'Price filters must be valid numbers' });
            }
        }

        const sortOptions = {
            newest: { createdAt: -1 },
            priceAsc: { price: 1 },
            priceDesc: { price: -1 }
        };
        const sort = sortOptions[req.query.sort] || sortOptions.newest;
        const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 50);
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

        const [products, total] = await Promise.all([Product.find(query)
            .populate('category', 'name slug')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit), Product.countDocuments(query)]);

        return res.status(200).json({ products: products.map(publicProduct), total, page, pages: Math.ceil(total / limit) });
    } catch (_error) {
        return res.status(500).json({ message: 'Could not load catalogue' });
    }
};

const getCatalogueProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug, status: 'published' })
            .populate('category', 'name slug');
        return product
            ? res.status(200).json(publicProduct(product))
            : res.status(404).json({ message: 'Product not found' });
    } catch (_error) {
        return res.status(500).json({ message: 'Could not load product' });
    }
};

const getCatalogueFilters = async (_req, res) => {
    try {
        const base = { status: 'published' };
        const [wattages, colours, fittings, brightnesses, categoryIds] = await Promise.all([
            Product.distinct('wattage', base),
            Product.distinct('lightColour', base),
            Product.distinct('fittingType', base),
            Product.distinct('brightness', base),
            Product.distinct('category', base)
        ]);
        const categories = await Category.find({ _id: { $in: categoryIds } })
            .select('name slug')
            .sort({ name: 1 })
            .lean();

        return res.status(200).json({
            categories,
            wattages: wattages.sort(),
            colours: colours.sort(),
            fittings: fittings.filter(Boolean).sort(),
            brightnesses: brightnesses.filter(Boolean).sort(),
            usages: ['Indoor', 'Outdoor', 'Commercial']
        });
    } catch (_error) {
        return res.status(500).json({ message: 'Could not load catalogue filters' });
    }
};

module.exports = { getCatalogue, getCatalogueProduct, getCatalogueFilters };
