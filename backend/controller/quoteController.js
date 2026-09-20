const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../model/orderModel');
const Product = require('../model/productModel');
const Customer = require('../model/customerModel');
const { sendQuoteEmail, sendQuoteAcceptedEmail } = require('../service/orderEmail');

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');
const quoteView = (order) => ({
    id: order._id,
    items: order.items,
    quote: order.quote,
    quoteStatus: order.quoteStatus,
    status: order.status,
    customerName: order.delivery.name,
    createdAt: order.createdAt
});

const sendQuote = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
        return res.status(400).json({ message: 'Invalid order ID' });
    const order = await Order.findById(req.params.id)
        .select('+quoteAccessHash')
        .populate('customer', 'email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (
        order.status === 'cancelled' ||
        order.quoteStatus === 'accepted' ||
        order.quoteStatus === 'accepting' ||
        order.stockReserved !== false
    )
        return res.status(409).json({ message: 'This order cannot use the new quote flow' });
    const prices = req.body.prices;
    if (
        !Array.isArray(prices) ||
        prices.length !== order.items.length ||
        prices.some((price) => !Number.isFinite(Number(price)) || Number(price) < 0 || price === '')
    )
        return res.status(400).json({ message: 'Enter a valid price for every item' });
    const deliveryCharge = Number(req.body.deliveryCharge);
    if (!Number.isFinite(deliveryCharge) || deliveryCharge < 0 || req.body.deliveryCharge === '')
        return res.status(400).json({ message: 'Enter a valid delivery charge, or 0' });
    const validUntil =
        typeof req.body.validUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.validUntil)
            ? new Date(`${req.body.validUntil}T23:59:59+05:30`)
            : new Date(NaN);
    if (Number.isNaN(validUntil.getTime()) || validUntil <= new Date())
        return res.status(400).json({ message: 'Choose a future quote expiry date' });
    if (typeof req.body.notes !== 'string' || req.body.notes.length > 1000)
        return res.status(400).json({ message: 'Quote notes must be under 1,000 characters' });
    const quoteItems = order.items.map((item, index) => ({
        product: item.product,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Math.round(Number(prices[index]) * 100) / 100
    }));
    const total =
        Math.round(
            (quoteItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) +
                deliveryCharge) *
                100
        ) / 100;
    const token = crypto.randomBytes(32).toString('hex');
    const updated = await Order.findOneAndUpdate(
        {
            _id: order._id,
            stockReserved: false,
            status: 'placed',
            quoteStatus: { $in: ['requested', 'sent', 'expired'] }
        },
        {
            $set: {
                quote: {
                    items: quoteItems,
                    deliveryCharge,
                    total,
                    notes: req.body.notes.trim(),
                    validUntil,
                    sentAt: new Date()
                },
                quoteStatus: 'sent',
                quoteAccessHash: hash(token),
                followUpAt: validUntil,
                contactedAt: new Date()
            }
        },
        { new: true, runValidators: true }
    );
    if (!updated)
        return res
            .status(409)
            .json({ message: 'This request changed. Refresh the order list and try again.' });
    const url = `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/quote/${order._id}?token=${token}`;
    let emailSent = false;
    try {
        emailSent = await sendQuoteEmail(updated, order.guestEmail || order.customer?.email, url);
    } catch (_error) {
        /* Admin can share the link manually. */
    }
    return res.json({ order: updated, shareUrl: url, emailSent });
};

const authorizedQuote = async (req) => {
    if (!mongoose.isValidObjectId(req.params.id)) return null;
    const order = await Order.findById(req.params.id).select('+quoteAccessHash +guestAccessHash');
    if (!order) return null;
    const quoteToken = req.headers['x-quote-token'];
    const guestToken = req.headers['x-guest-token'];
    if (req.customer?.id && String(order.customer) === req.customer.id) return order;
    if (req.customer?.id && order.guestEmail) {
        const customer = await Customer.findById(req.customer.id)
            .select('email emailVerified')
            .lean();
        if (customer?.emailVerified && customer.email === order.guestEmail) return order;
    }
    if (
        typeof quoteToken === 'string' &&
        /^[a-f0-9]{64}$/.test(quoteToken) &&
        hash(quoteToken) === order.quoteAccessHash
    )
        return order;
    if (
        typeof guestToken === 'string' &&
        /^[a-f0-9]{64}$/.test(guestToken) &&
        hash(guestToken) === order.guestAccessHash
    )
        return order;
    return null;
};

const getQuote = async (req, res) => {
    const order = await authorizedQuote(req);
    return order
        ? res.json(quoteView(order))
        : res.status(404).json({ message: 'Quote not found' });
};

const acceptQuote = async (req, res) => {
    const accessible = await authorizedQuote(req);
    if (!accessible) return res.status(404).json({ message: 'Quote not found' });
    const now = new Date();
    if (accessible.quoteStatus !== 'sent' || accessible.status === 'cancelled')
        return res.status(409).json({ message: 'This quote is no longer available' });
    if (accessible.quote.validUntil <= now) {
        await Order.updateOne(
            {
                _id: accessible._id,
                quoteStatus: 'sent',
                quoteAccessHash: accessible.quoteAccessHash
            },
            { $set: { quoteStatus: 'expired' } }
        );
        return res
            .status(409)
            .json({ message: 'This quote has expired. Please ask for a new price.' });
    }
    const claimed = await Order.findOneAndUpdate(
        {
            _id: accessible._id,
            quoteStatus: 'sent',
            quoteAccessHash: accessible.quoteAccessHash,
            'quote.validUntil': { $gt: now },
            status: 'placed'
        },
        { $set: { quoteStatus: 'accepting' } },
        { new: true }
    );
    if (!claimed) return res.status(409).json({ message: 'This quote has already been handled' });
    const reserved = [];
    try {
        for (const item of claimed.items) {
            const product = await Product.findOneAndUpdate(
                { _id: item.product, status: 'published', stockQuantity: { $gte: item.quantity } },
                { $inc: { stockQuantity: -item.quantity } }
            );
            if (!product)
                throw new Error(
                    `Not enough stock is available for ${item.productName}. Please contact Santosh.`
                );
            reserved.push(item);
        }
        claimed.stockReserved = true;
        claimed.status = 'confirmed';
        claimed.quoteStatus = 'accepted';
        claimed.quote.acceptedAt = new Date();
        claimed.statusHistory.push({ status: 'confirmed', at: claimed.quote.acceptedAt });
        claimed.total = claimed.quote.total;
        await claimed.save();
        try {
            const customer = claimed.customer
                ? await Customer.findById(claimed.customer).select('email').lean()
                : null;
            await sendQuoteAcceptedEmail(claimed, claimed.guestEmail || customer?.email);
        } catch (_error) {
            /* Acceptance remains confirmed if email is unavailable. */
        }
        return res.json(quoteView(claimed));
    } catch (error) {
        await Promise.allSettled(
            reserved.map((item) =>
                Product.updateOne({ _id: item.product }, { $inc: { stockQuantity: item.quantity } })
            )
        );
        await Order.updateOne(
            { _id: claimed._id, quoteStatus: 'accepting' },
            { $set: { quoteStatus: 'sent' } }
        );
        return res.status(409).json({
            message: error.message.startsWith('Not enough stock')
                ? error.message
                : 'Could not accept this quote. Please try again.'
        });
    }
};

module.exports = { sendQuote, getQuote, acceptQuote };
