const mongoose = require('mongoose');
const Product = require('../model/productModel');
const Category = require('../model/categoryModel');

const slugify = (value) =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const createUniqueSlug = async (name, excludedId) => {
    const baseSlug = slugify(name) || 'product';
    let slug = baseSlug;
    let suffix = 2;

    while (await Product.exists({ slug, _id: { $ne: excludedId } })) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
    }

    return slug;
};

const sendError = (res, error) => {
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Please check the product details',
            errors: Object.values(error.errors).map((item) => item.message)
        });
    }

    if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid product id' });
    }

    return res.status(500).json({ message: 'Something went wrong' });
};

const createProduct = async (req, res) => {
    try {
        if (
            !mongoose.isValidObjectId(req.body.category) ||
            !(await Category.exists({ _id: req.body.category }))
        ) {
            return res.status(400).json({ message: 'Please select a valid category' });
        }
        const product = await Product.create({
            ...req.body,
            slug: await createUniqueSlug(req.body.name || '')
        });
        await product.populate('category', 'name slug');
        return res.status(201).json(product);
    } catch (error) {
        return sendError(res, error);
    }
};

const getProducts = async (_req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name slug')
            .sort({ createdAt: -1 });
        return res.status(200).json(products);
    } catch (error) {
        return sendError(res, error);
    }
};

const getProduct = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product id' });
        }

        const product = await Product.findById(req.params.id).populate('category', 'name slug');
        return product
            ? res.status(200).json(product)
            : res.status(404).json({ message: 'Product not found' });
    } catch (error) {
        return sendError(res, error);
    }
};

const updateProduct = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product id' });
        }

        const existingProduct = await Product.findById(req.params.id);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const update = { ...req.body };
        if (
            update.category &&
            (!mongoose.isValidObjectId(update.category) ||
                !(await Category.exists({ _id: update.category })))
        ) {
            return res.status(400).json({ message: 'Please select a valid category' });
        }
        if (update.name && update.name !== existingProduct.name) {
            update.slug = await createUniqueSlug(update.name, existingProduct._id);
        } else {
            delete update.slug;
        }
        if (
            update.stockQuantity !== undefined &&
            Number(update.stockQuantity) !== existingProduct.stockQuantity
        ) {
            const nextQuantity = Number(update.stockQuantity);
            update.$push = {
                inventoryHistory: {
                    previousQuantity: existingProduct.stockQuantity,
                    newQuantity: nextQuantity,
                    change: nextQuantity - existingProduct.stockQuantity,
                    note: req.body.stockNote || 'Product edited'
                }
            };
        }
        delete update.stockNote;
        delete update.inventoryHistory;

        const product = await Product.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true
        }).populate('category', 'name slug');
        return res.status(200).json(product);
    } catch (error) {
        return sendError(res, error);
    }
};

const adjustStock = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ message: 'Invalid product id' });
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        const nextQuantity = Number(req.body.stockQuantity);
        if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
            return res
                .status(400)
                .json({ message: 'Stock quantity must be a non-negative whole number' });
        }
        product.inventoryHistory.push({
            previousQuantity: product.stockQuantity,
            newQuantity: nextQuantity,
            change: nextQuantity - product.stockQuantity,
            note: req.body.note || 'Manual stock adjustment'
        });
        product.stockQuantity = nextQuantity;
        await product.save();
        return res.status(200).json(product);
    } catch (error) {
        return sendError(res, error);
    }
};

const deleteProduct = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product id' });
        }

        const product = await Product.findByIdAndDelete(req.params.id);
        return product
            ? res.status(200).json({ message: 'Product deleted successfully' })
            : res.status(404).json({ message: 'Product not found' });
    } catch (error) {
        return sendError(res, error);
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    adjustStock,
    deleteProduct
};
