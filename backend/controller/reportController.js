const Enquiry = require('../model/enquiryModel');
const Product = require('../model/productModel');

const getProductEnquiries = async (_req, res) => {
    try {
        const counts = await Enquiry.aggregate([
            {
                $group: {
                    _id: '$product',
                    enquiries: { $sum: 1 },
                    newEnquiries: { $sum: { $cond: [{ $eq: ['$status', 'New'] }, 1, 0] } },
                    lastEnquiryAt: { $max: '$createdAt' }
                }
            },
            { $sort: { enquiries: -1, lastEnquiryAt: -1 } }
        ]);
        const products = await Product.find({ _id: { $in: counts.map((row) => row._id) } })
            .select('name slug')
            .lean();
        const names = new Map(products.map((product) => [String(product._id), product.name]));
        return res.json(
            counts.map((row) => ({
                productId: String(row._id),
                productName: names.get(String(row._id)) || 'Deleted product',
                enquiries: row.enquiries,
                newEnquiries: row.newEnquiries,
                lastEnquiryAt: row.lastEnquiryAt
            }))
        );
    } catch (_error) {
        return res.status(500).json({ message: 'Could not load product enquiries' });
    }
};

module.exports = { getProductEnquiries };
