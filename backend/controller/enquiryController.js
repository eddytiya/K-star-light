const mongoose = require('mongoose');
const Enquiry = require('../model/enquiryModel');
const Product = require('../model/productModel');

const createEnquiry = async (req, res) => {
    try {
        if (
            !mongoose.isValidObjectId(req.body.product) ||
            !(await Product.exists({ _id: req.body.product, status: 'published' }))
        ) {
            return res.status(400).json({ message: 'Please select a valid published product' });
        }
        const enquiry = await Enquiry.create(req.body);
        return res.status(201).json({ message: 'Quotation request received', id: enquiry._id });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        return res.status(500).json({ message: 'Could not submit quotation request' });
    }
};

const getEnquiries = async (req, res) => {
    try {
        const query = req.query.status ? { status: req.query.status } : {};
        const enquiries = await Enquiry.find(query)
            .populate('product', 'name slug images')
            .sort({ createdAt: -1 });
        return res.status(200).json(enquiries);
    } catch (_error) {
        return res.status(500).json({ message: 'Could not load enquiries' });
    }
};

const updateEnquiry = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ message: 'Invalid enquiry id' });
        const update = {};
        if (req.body.status !== undefined) update.status = req.body.status;
        if (req.body.quotedTotal !== undefined) update.quotedTotal = req.body.quotedTotal;
        if (req.body.quoteNote !== undefined) update.quoteNote = req.body.quoteNote;
        const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true
        });
        return enquiry
            ? res.status(200).json(enquiry)
            : res.status(404).json({ message: 'Enquiry not found' });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const deleteEnquiry = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ message: 'Invalid enquiry id' });
        const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
        return enquiry
            ? res.status(200).json({ message: 'Enquiry deleted' })
            : res.status(404).json({ message: 'Enquiry not found' });
    } catch (_error) {
        return res.status(500).json({ message: 'Could not delete enquiry' });
    }
};

module.exports = { createEnquiry, getEnquiries, updateEnquiry, deleteEnquiry };
