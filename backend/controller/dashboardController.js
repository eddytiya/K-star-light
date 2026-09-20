const Product = require('../model/productModel');
const Enquiry = require('../model/enquiryModel');
const Order = require('../model/orderModel');
const ManualOrder = require('../model/manualOrderModel');

const getDashboard = async (_req, res) => {
    try {
        const [products, published, featured, lowStock, outOfStock, enquiries, newEnquiries, recentEnquiries, pendingRequests, quotesAwaitingReply, dueFollowUps, manualOrders, confirmedOrders] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ status: 'published' }),
            Product.countDocuments({ featured: true }),
            Product.find({ stockQuantity: { $gt: 0 }, $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] } }).select('name stockQuantity lowStockThreshold').sort({ stockQuantity: 1 }).lean(),
            Product.countDocuments({ stockQuantity: 0 }),
            Enquiry.countDocuments(),
            Enquiry.countDocuments({ status: 'New' }),
            Enquiry.find().populate('product', 'name').sort({ createdAt: -1 }).limit(5).lean(),
            Order.countDocuments({ status: 'placed', $or: [{ quoteStatus: 'requested' }, { quoteStatus: { $exists: false } }] }),
            Order.countDocuments({ quoteStatus: 'sent', status: 'placed' }),
            Order.find({ $or: [{ status: 'placed', $or: [{ contactedAt: { $exists: false } }, { followUpAt: { $lte: new Date() } }] }, { status: 'confirmed', trackingNumber: { $in: [null, ''] } }] }).sort({ createdAt: 1 }).limit(12).select('productName delivery quoteStatus status followUpAt contactedAt createdAt').lean(),
            ManualOrder.countDocuments(),
            Order.countDocuments({ status: 'confirmed', trackingNumber: { $in: [null, ''] } })
        ]);
        return res.status(200).json({ products, published, featured, outOfStock, enquiries, newEnquiries, lowStock, recentEnquiries, pendingRequests, quotesAwaitingReply, dueFollowUps, manualOrders, confirmedOrders });
    } catch (_error) {
        return res.status(500).json({ message: 'Could not load dashboard' });
    }
};

module.exports = { getDashboard };
