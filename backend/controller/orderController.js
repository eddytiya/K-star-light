const mongoose = require('mongoose');
const crypto = require('crypto');
const Product = require('../model/productModel');
const Customer = require('../model/customerModel');
const Order = require('../model/orderModel');
const { sendOrderEmails, sendStatusEmail } = require('../service/orderEmail');

const createOrder = async (req, res) => {
    const requested = Array.isArray(req.body.items)
        ? req.body.items
        : [{ product: req.body.product, quantity: req.body.quantity }];
    const paymentMethod = req.body.paymentMethod;
    if (
        !requested.length ||
        requested.length > 30 ||
        requested.some(
            (item) =>
                !mongoose.isValidObjectId(item.product) ||
                !Number.isInteger(Number(item.quantity)) ||
                Number(item.quantity) < 1 ||
                Number(item.quantity) > 100
        ) ||
        new Set(requested.map((item) => item.product)).size !== requested.length
    )
        return res
            .status(400)
            .json({ message: 'Choose valid products and quantities (1–100 each)' });
    if (!['cash', 'upi'].includes(paymentMethod))
        return res.status(400).json({ message: 'Choose cash or UPI' });
    const customer = req.customer ? await Customer.findById(req.customer.id) : null;
    if (req.customer && !customer)
        return res.status(401).json({ message: 'Customer account not found' });
    const guestEmail =
        typeof req.body.guestEmail === 'string' ? req.body.guestEmail.trim().toLowerCase() : '';
    if (!customer && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))
        return res
            .status(400)
            .json({ message: 'Enter a valid email address for your guest order' });

    const products = await Product.find({
        _id: { $in: requested.map((item) => item.product) },
        status: 'published'
    });
    if (products.length !== requested.length)
        return res.status(404).json({ message: 'A product is not available' });
    const items = requested.map((item) => {
        const product = products.find((entry) => String(entry._id) === item.product);
        return {
            product: product._id,
            productName: product.name,
            slug: product.slug,
            unitPrice: product.price,
            quantity: Number(item.quantity)
        };
    });
    const total =
        Math.round(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100) /
        100;
    if (paymentMethod === 'cash' && total >= 5000) {
        return res.status(400).json({ message: 'Cash is available only for orders below ₹5,000' });
    }

    // Validate delivery before reserving stock.
    const guestAccessToken = customer ? null : crypto.randomBytes(32).toString('hex');
    const order = new Order({
        customer: customer?._id,
        guestEmail: customer ? undefined : guestEmail,
        guestAccessHash: guestAccessToken
            ? crypto.createHash('sha256').update(guestAccessToken).digest('hex')
            : undefined,
        product: items[0].product,
        productName: items.length === 1 ? items[0].productName : `${items.length} products`,
        unitPrice: items[0].unitPrice,
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        items,
        total,
        stockReserved: false,
        delivery: req.body.delivery,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'not_applicable' : 'pending',
        statusHistory: [{ status: 'placed', at: new Date() }]
    });
    try {
        await order.validate();
    } catch (error) {
        return res.status(400).json({
            message: Object.values(error.errors)[0]?.message || 'Invalid delivery details'
        });
    }

    try {
        await order.save();
    } catch (_error) {
        return res.status(500).json({ message: 'Could not place order' });
    }

    try {
        order.emailStatus = await sendOrderEmails(order, customer || { email: guestEmail });
    } catch (_error) {
        order.emailStatus = 'failed';
    }
    await order.save();
    return res.status(201).json({
        order: {
            id: order._id,
            productName: order.productName,
            quantity: order.quantity,
            total: order.total,
            paymentMethod: order.paymentMethod,
            items: order.items,
            paymentStatus: order.paymentStatus,
            status: order.status,
            emailStatus: order.emailStatus,
            guestAccessToken
        }
    });
};

const getMyOrders = async (req, res) => {
    const customer = await Customer.findById(req.customer.id);
    if (!customer) return res.status(401).json({ message: 'Account not found' });
    const query = customer.emailVerified
        ? { $or: [{ customer: customer._id }, { guestEmail: customer.email }] }
        : { customer: customer._id };
    const orders = await Order.find(query)
        .populate('product', 'slug')
        .sort({ createdAt: -1 })
        .lean();
    return res.json(orders);
};

const getGuestOrder = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
        return res.status(404).json({ message: 'Order not found' });
    const token = req.headers['x-guest-token'];
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token))
        return res.status(401).json({ message: 'Guest order access required' });
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const order = await Order.findOne({ _id: req.params.id, guestAccessHash: hash }).lean();
    return order ? res.json(order) : res.status(404).json({ message: 'Order not found' });
};

const getAllOrders = async (_req, res) => {
    const orders = await Order.find()
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .lean();
    return res.json(orders);
};

const updateOrder = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
        return res.status(400).json({ message: 'Invalid order id' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const { status, paymentStatus, trackingNumber, trackingUrl } = req.body;
    if (status && !['placed', 'confirmed', 'shipped', 'completed', 'cancelled'].includes(status))
        return res.status(400).json({ message: 'Invalid order status' });
    if (order.quoteStatus === 'accepting' && status)
        return res
            .status(409)
            .json({ message: 'The customer is accepting this quote. Refresh and try again.' });
    if (status === 'placed' && order.quoteStatus === 'accepted')
        return res
            .status(409)
            .json({ message: 'An accepted quote cannot return to the request stage' });
    if (status && status !== 'placed' && status !== 'cancelled' && order.stockReserved === false)
        return res.status(409).json({
            message: 'The customer must accept a quote before this order can be confirmed'
        });
    if (paymentStatus && !['pending', 'verified', 'not_applicable'].includes(paymentStatus))
        return res.status(400).json({ message: 'Invalid payment status' });
    if (paymentStatus === 'verified' && order.stockReserved === false)
        return res
            .status(409)
            .json({ message: 'The quote must be accepted before payment can be verified' });
    if (paymentStatus === 'verified' && order.paymentMethod !== 'upi')
        return res.status(400).json({ message: 'Only UPI orders can be verified' });
    if (
        trackingNumber !== undefined &&
        (typeof trackingNumber !== 'string' || trackingNumber.length > 100)
    )
        return res.status(400).json({ message: 'Invalid tracking number' });
    if (
        trackingUrl !== undefined &&
        (typeof trackingUrl !== 'string' ||
            trackingUrl.length > 500 ||
            (trackingUrl.trim() && !/^https:\/\/[^\s]+$/i.test(trackingUrl.trim())))
    )
        return res.status(400).json({ message: 'Enter a valid HTTPS courier tracking link' });
    if (req.body.followUpAt && Number.isNaN(Date.parse(req.body.followUpAt)))
        return res.status(400).json({ message: 'Invalid follow-up date' });
    if (order.status === 'cancelled' && status && status !== 'cancelled')
        return res.status(400).json({ message: 'Cancelled orders cannot be reopened' });
    if (status === 'cancelled' && order.status !== 'cancelled' && order.stockReserved !== false) {
        const items = order.items?.length
            ? order.items
            : [{ product: order.product, quantity: order.quantity }];
        await Promise.all(
            items.map((item) =>
                Product.updateOne({ _id: item.product }, { $inc: { stockQuantity: item.quantity } })
            )
        );
        order.stockReserved = false;
    }
    const statusChanged = Boolean(status && status !== order.status);
    if (status) order.status = status;
    if (statusChanged) order.statusHistory.push({ status, at: new Date() });
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber.trim();
    if (trackingUrl !== undefined) order.trackingUrl = trackingUrl.trim();
    if (req.body.contacted === true) order.contactedAt = new Date();
    if (req.body.followUpAt !== undefined) {
        order.followUpAt = req.body.followUpAt || null;
    }
    await order.save();
    if (statusChanged) {
        try {
            await order.populate('customer', 'email');
            await sendStatusEmail(order);
        } catch (_error) {
            /* Order update remains saved when email fails. */
        }
    }
    return res.json(order);
};

module.exports = { createOrder, getMyOrders, getGuestOrder, getAllOrders, updateOrder };
