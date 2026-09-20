const mongoose = require('mongoose');
const ManualOrder = require('../model/manualOrderModel');

const fields = ['customerName', 'companyName', 'phone', 'email', 'items', 'agreedTotal', 'notes', 'status', 'orderDate'];
const validationMessage = (error) => Object.values(error.errors || {})[0]?.message || 'Invalid manual order';

const getManualOrders = async (_req, res) => {
    const orders = await ManualOrder.find().sort({ orderDate: -1, createdAt: -1 }).lean();
    return res.json(orders);
};

const saveManualOrder = async (req, res) => {
    if (req.params.id && !mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID' });
    if (req.body.items !== undefined && (!Array.isArray(req.body.items) || req.body.items.length < 1 || req.body.items.length > 30)) return res.status(400).json({ message: 'Add between 1 and 30 items' });
    const data = Object.fromEntries(fields.filter((field) => Object.hasOwn(req.body, field)).map((field) => [field, req.body[field]]));
    if (data.items) data.items = data.items.map((item) => ({ description: item?.description, quantity: item?.quantity, unitPrice: item?.unitPrice === '' || item?.unitPrice == null ? undefined : item?.unitPrice }));
    if (data.agreedTotal === '') data.agreedTotal = undefined;
    try {
        const order = req.params.id ? await ManualOrder.findById(req.params.id) : new ManualOrder({ createdBy: req.admin.id });
        if (!order) return res.status(404).json({ message: 'Manual order not found' });
        Object.assign(order, data);
        await order.save();
        return res.status(req.params.id ? 200 : 201).json(order);
    } catch (error) {
        if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: validationMessage(error) });
        throw error;
    }
};

const deleteManualOrder = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID' });
    const order = await ManualOrder.findByIdAndDelete(req.params.id);
    return order ? res.json({ message: 'Manual order deleted' }) : res.status(404).json({ message: 'Manual order not found' });
};

module.exports = { getManualOrders, saveManualOrder, deleteManualOrder };
