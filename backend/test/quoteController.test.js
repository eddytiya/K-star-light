const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const Order = require('../model/orderModel');
const Product = require('../model/productModel');
const { acceptQuote } = require('../controller/quoteController');

const token = 'a'.repeat(64);
const id = '507f1f77bcf86cd799439011';
const productId = '507f1f77bcf86cd799439012';
const original = { findById: Order.findById, findOneAndUpdate: Order.findOneAndUpdate, updateOne: Order.updateOne, productFindOneAndUpdate: Product.findOneAndUpdate, productUpdateOne: Product.updateOne };

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } });
const setup = (stockAvailable) => {
    const accessible = { _id: id, customer: null, quoteAccessHash: crypto.createHash('sha256').update(token).digest('hex'), quoteStatus: 'sent', status: 'placed', quote: { validUntil: new Date(Date.now() + 86400000) } };
    const claimed = { _id: id, items: [{ product: productId, productName: 'Lamp', quantity: 2 }], delivery: { name: 'Buyer' }, createdAt: new Date(), quote: { total: 1200, validUntil: accessible.quote.validUntil }, save: async () => {} };
    let reserved = 0;
    let restored = 0;
    Order.findById = () => ({ select: async () => accessible });
    Order.findOneAndUpdate = async () => claimed;
    Order.updateOne = async () => {};
    Product.findOneAndUpdate = async () => { if (stockAvailable) reserved += 2; return stockAvailable ? { _id: productId } : null };
    Product.updateOne = async () => { restored += 2 };
    return { claimed, counts: () => ({ reserved, restored }) };
};

test.after(() => { Order.findById = original.findById; Order.findOneAndUpdate = original.findOneAndUpdate; Order.updateOne = original.updateOne; Product.findOneAndUpdate = original.productFindOneAndUpdate; Product.updateOne = original.productUpdateOne });

test('accepting a quote reserves stock and confirms the order', async () => {
    const { claimed, counts } = setup(true);
    const res = response();
    await acceptQuote({ params: { id }, headers: { 'x-quote-token': token } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(counts(), { reserved: 2, restored: 0 });
    assert.equal(claimed.status, 'confirmed');
    assert.equal(claimed.quoteStatus, 'accepted');
    assert.equal(claimed.total, 1200);
});

test('insufficient stock leaves the quote unaccepted', async () => {
    const { claimed, counts } = setup(false);
    const res = response();
    await acceptQuote({ params: { id }, headers: { 'x-quote-token': token } }, res);
    assert.equal(res.statusCode, 409);
    assert.deepEqual(counts(), { reserved: 0, restored: 0 });
    assert.notEqual(claimed.quoteStatus, 'accepted');
});

test('a shortage on a later item restores stock reserved for earlier items', async () => {
    const { claimed, counts } = setup(true);
    claimed.items.push({ product: '507f1f77bcf86cd799439013', productName: 'Driver', quantity: 1 });
    Product.findOneAndUpdate = async (query) => query._id === productId ? { _id: productId } : null;
    const res = response();
    await acceptQuote({ params: { id }, headers: { 'x-quote-token': token } }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(counts().restored, 2);
    assert.notEqual(claimed.quoteStatus, 'accepted');
});

test('an expired quote does not reserve stock', async () => {
    const { counts } = setup(true);
    Order.findById = () => ({ select: async () => ({ _id: id, customer: null, quoteAccessHash: crypto.createHash('sha256').update(token).digest('hex'), quoteStatus: 'sent', status: 'placed', quote: { validUntil: new Date(Date.now() - 1000) } }) });
    const res = response();
    await acceptQuote({ params: { id }, headers: { 'x-quote-token': token } }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(counts().reserved, 0);
});
