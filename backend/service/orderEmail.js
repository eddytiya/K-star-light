const nodemailer = require('nodemailer');

const sendOrderEmails = async (order, customer) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, OWNER_EMAIL } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !OWNER_EMAIL) {
        return 'not_configured';
    }

    const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    const whatsappNumber = (process.env.ORDER_WHATSAPP_NUMBER || '919920591596').replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello K Star Light, please confirm my order ${order._id} before payment.`)}`;
    const details = [
        `Order: ${order._id}`,
        `Products: ${(order.items?.length ? order.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ') : `${order.productName} × ${order.quantity}`)}`,
        `Indicative product total: ₹${order.total}`,
        `Payment: ${order.paymentMethod.toUpperCase()}`,
        'Status: Awaiting owner confirmation before payment or delivery',
        `Deliver to: ${order.delivery.name}, ${order.delivery.address}, ${order.delivery.city}, ${order.delivery.state} ${order.delivery.postalCode}`,
        `Phone: ${order.delivery.phone}`
    ].join('\n');
    const messages = [
        { from: MAIL_FROM, to: OWNER_EMAIL, subject: `New K Star Light order request ${order._id}`, text: `A new order request was placed by ${customer.email}. Contact the customer before sharing payment details or arranging delivery.\n\n${details}` },
        { from: MAIL_FROM, to: customer.email, subject: `Your K Star Light order request ${order._id}`, text: `Thank you for your order request. Please do not pay until we speak with you and confirm the details.\n\n${details}\n\nConfirm your request on WhatsApp: ${whatsappUrl}\nOpen the link and tap Send. We will also contact you.` }
    ];
    const results = await Promise.allSettled(messages.map((message) => transport.sendMail(message)));
    return results.every((result) => result.status === 'fulfilled') ? 'sent' : 'failed';
};

const sendStatusEmail = async (order) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
    const recipient = order.guestEmail || order.customer?.email;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !recipient) return;
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
    await transport.sendMail({ from: MAIL_FROM, to: recipient, subject: `K Star Light order ${order._id} update`, text: `Your order ${order._id} is now ${order.status}.${order.trackingNumber ? `\nTracking number: ${order.trackingNumber}` : ''}\nContact us if you need help.` });
};

const sendQuoteEmail = async (order, recipient, url) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !recipient) return false;
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
    const lines = order.quote.items.map((item) => `${item.productName} × ${item.quantity} @ ₹${item.unitPrice} = ₹${item.quantity * item.unitPrice}`).join('\n');
    await transport.sendMail({ from: MAIL_FROM, to: recipient, subject: `Your K Star Light quote ${order._id}`, text: `Santosh has prepared a quote for your order request.\n\n${lines}\nDelivery: ₹${order.quote.deliveryCharge}\nTotal: ₹${order.quote.total}\nValid until: ${order.quote.validUntil.toLocaleDateString('en-IN')}\n${order.quote.notes ? `Notes: ${order.quote.notes}\n` : ''}\nReview and accept your quote: ${url}\n\nPlease do not pay until you have reviewed and accepted the quote.` });
    return true;
};

const sendQuoteAcceptedEmail = async (order, recipient) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, OWNER_EMAIL } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !OWNER_EMAIL) return false;
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
    const details = `Order ${order._id} was confirmed at the quoted total of ₹${order.quote.total}.\nCustomer: ${order.delivery.name}\nPhone: ${order.delivery.phone}.`;
    const messages = [{ from: MAIL_FROM, to: OWNER_EMAIL, subject: `Quote accepted: order ${order._id}`, text: `${details}\nArrange payment and delivery with the customer.` }];
    if (recipient) messages.push({ from: MAIL_FROM, to: recipient, subject: `Your K Star Light order ${order._id} is confirmed`, text: `${details}\nSantosh will contact you about payment and delivery.` });
    const results = await Promise.allSettled(messages.map((message) => transport.sendMail(message)));
    return results.every((result) => result.status === 'fulfilled');
};

module.exports = { sendOrderEmails, sendStatusEmail, sendQuoteEmail, sendQuoteAcceptedEmail };
