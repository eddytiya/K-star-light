const Order = require('../model/orderModel');
const ManualOrder = require('../model/manualOrderModel');

const getCustomerRecords = async (_req, res) => {
    const [website, manual] = await Promise.all([
        Order.find().populate('customer', 'email name').select('customer guestEmail delivery items total quoteStatus status createdAt').lean(),
        ManualOrder.find().select('customerName companyName phone email items agreedTotal status orderDate').lean()
    ]);
    const records = [];
    const add = (entry) => {
        const email = entry.email?.trim().toLowerCase();
        const phone = entry.phone?.replace(/\D/g, '');
        const company = entry.companyName?.trim().toLowerCase();
        const name = entry.name?.trim().toLowerCase();
        const record = records.find((candidate) => (email && candidate.emails.has(email)) || (phone && candidate.phones.has(phone)) || (company && candidate.companies.has(company)) || (!email && !phone && !company && name && candidate.names.has(name))) || { key: String(entry.order.id), name: entry.name, companyName: entry.companyName, phone: entry.phone, email: entry.email, orders: [], emails: new Set(), phones: new Set(), companies: new Set(), names: new Set() };
        record.name ||= entry.name;
        record.companyName ||= entry.companyName;
        record.phone ||= entry.phone;
        record.email ||= entry.email;
        if (email) record.emails.add(email);
        if (phone) record.phones.add(phone);
        if (company) record.companies.add(company);
        if (name) record.names.add(name);
        record.orders.push(entry.order);
        if (!records.includes(record)) records.push(record);
    };
    website.forEach((order) => add({ name: order.delivery.name, companyName: order.delivery.companyName, phone: order.delivery.phone, email: order.customer?.email || order.guestEmail, order: { id: order._id, source: 'website', date: order.createdAt, items: order.items.map((item) => `${item.productName} × ${item.quantity}`), total: order.total, status: order.status, quoteStatus: order.quoteStatus } }));
    manual.forEach((order) => add({ name: order.customerName, companyName: order.companyName, phone: order.phone, email: order.email, order: { id: order._id, source: 'manual', date: order.orderDate, items: order.items.map((item) => `${item.description} × ${item.quantity}`), total: order.agreedTotal, status: order.status } }));
    return res.json(records.map(({ emails, phones, companies, names, ...record }) => ({ ...record, orders: record.orders.sort((a, b) => new Date(b.date) - new Date(a.date)) })).sort((a, b) => new Date(b.orders[0].date) - new Date(a.orders[0].date)));
};

module.exports = { getCustomerRecords };
