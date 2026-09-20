const mongoose = require('mongoose');
const Category = require('../model/categoryModel');
const Product = require('../model/productModel');

const slugify = (value) =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const uniqueSlug = async (name, excludedId) => {
    const base = slugify(name) || 'category';
    let slug = base;
    let suffix = 2;

    while (await Category.exists({ slug, _id: { $ne: excludedId } })) {
        slug = `${base}-${suffix}`;
        suffix += 1;
    }
    return slug;
};

const sendError = (res, error) => {
    if (error.code === 11000) {
        return res.status(409).json({ message: 'A category with this name already exists' });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Please check the category details',
            errors: Object.values(error.errors).map((item) => item.message)
        });
    }
    return res.status(500).json({ message: 'Something went wrong' });
};

const createCategory = async (req, res) => {
    try {
        const category = await Category.create({
            name: req.body.name,
            description: req.body.description,
            slug: await uniqueSlug(req.body.name || '')
        });
        return res.status(201).json(category);
    } catch (error) {
        return sendError(res, error);
    }
};

const getCategories = async (_req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 }).lean();
        const withCounts = await Promise.all(
            categories.map(async (category) => ({
                ...category,
                productCount: await Product.countDocuments({ category: category._id })
            }))
        );
        return res.status(200).json(withCounts);
    } catch (error) {
        return sendError(res, error);
    }
};

const getCategory = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid category id' });
        }
        const category = await Category.findById(req.params.id).lean();
        if (!category) return res.status(404).json({ message: 'Category not found' });
        category.productCount = await Product.countDocuments({ category: category._id });
        return res.status(200).json(category);
    } catch (error) {
        return sendError(res, error);
    }
};

const updateCategory = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid category id' });
        }
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        if (req.body.name && req.body.name !== category.name) {
            category.name = req.body.name;
            category.slug = await uniqueSlug(req.body.name, category._id);
        }
        category.description = req.body.description ?? category.description;
        await category.save();
        return res.status(200).json(category);
    } catch (error) {
        return sendError(res, error);
    }
};

const deleteCategory = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid category id' });
        }
        if (await Product.exists({ category: req.params.id })) {
            return res.status(409).json({
                message: 'This category is assigned to products. Reassign them before deleting it.'
            });
        }
        const category = await Category.findByIdAndDelete(req.params.id);
        return category
            ? res.status(200).json({ message: 'Category deleted successfully' })
            : res.status(404).json({ message: 'Category not found' });
    } catch (error) {
        return sendError(res, error);
    }
};

module.exports = { createCategory, getCategories, getCategory, updateCategory, deleteCategory };
