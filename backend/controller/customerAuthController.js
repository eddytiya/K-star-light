const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const Customer = require('../model/customerModel');
const { sendVerificationCode } = require('../service/customerEmail');

const tokenFor = (customer) => jwt.sign({ id: customer._id.toString(), role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '7d' });
const profileFor = (customer) => ({ id: customer._id, name: customer.name, email: customer.email, phone: customer.phone, emailVerified: customer.emailVerified });
const normalizedEmail = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const isAdminEmail = (email) => email === normalizedEmail(process.env.ADMIN_EMAIL);

const register = async (req, res) => {
    const { name, password, phone } = req.body;
    const email = normalizedEmail(req.body.email);
    if (isAdminEmail(email)) return res.status(409).json({ message: 'Use the admin login for this email', adminRedirect: true });
    if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8) return res.status(400).json({ message: 'Provide a name, valid email and password of at least 8 characters' });
    try {
        const customer = await Customer.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 12) });
        return res.status(201).json({ token: tokenFor(customer), customer: profileFor(customer) });
    } catch (error) { return res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? 'Email already registered' : 'Could not create account' }); }
};

const login = async (req, res) => {
    try {
        if (isAdminEmail(normalizedEmail(req.body.email))) return res.status(409).json({ message: 'Use the admin login for this email', adminRedirect: true });
        const customer = await Customer.findOne({ email: normalizedEmail(req.body.email) });
        if (!customer?.passwordHash || !await bcrypt.compare(req.body.password || '', customer.passwordHash)) return res.status(401).json({ message: 'Invalid email or password' });
        return res.json({ token: tokenFor(customer), customer: profileFor(customer) });
    } catch (_error) { return res.status(500).json({ message: 'Could not log in' }); }
};

const verifiedGoogleIdentity = async (credential) => {
    if (!process.env.GOOGLE_CLIENT_ID) throw new Error('Google sign-in is not configured');
    if (typeof credential !== 'string' || credential.length > 5000) throw new Error('Invalid Google credential');
    const ticket = await new OAuth2Client().verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) throw new Error('Google did not verify this account');
    const email = normalizedEmail(payload.email);
    const authoritative = email.endsWith('@gmail.com') || Boolean(payload.hd);
    return { sub: payload.sub, email, name: payload.name || email.split('@')[0], authoritative };
};

const googleLogin = async (req, res) => {
    try {
        const identity = await verifiedGoogleIdentity(req.body.credential);
        if (isAdminEmail(identity.email)) return res.status(409).json({ message: 'Use the admin login for this email', adminRedirect: true });
        let customer = await Customer.findOne({ googleSub: identity.sub });
        if (!customer) {
            customer = await Customer.findOne({ email: identity.email });
            if (customer) return res.status(409).json({ message: 'This email already has an account. Sign in with your password, then connect Google from your account.' });
            customer = await Customer.create({ name: identity.name, email: identity.email, googleSub: identity.sub, emailVerified: identity.authoritative });
        }
        return res.json({ token: tokenFor(customer), customer: profileFor(customer) });
    } catch (error) { return res.status(error.code === 11000 ? 409 : 401).json({ message: error.code === 11000 ? 'Email already registered' : error.message || 'Google sign-in failed' }); }
};

const linkGoogle = async (req, res) => {
    try {
        const identity = await verifiedGoogleIdentity(req.body.credential);
        const customer = await Customer.findById(req.customer.id);
        if (!customer || customer.email !== identity.email) return res.status(400).json({ message: 'Use the Google account with the same email as your K Star Light account' });
        if (customer.googleSub && customer.googleSub !== identity.sub) return res.status(409).json({ message: 'A different Google account is already linked' });
        const owner = await Customer.findOne({ googleSub: identity.sub });
        if (owner && String(owner._id) !== String(customer._id)) return res.status(409).json({ message: 'Google account is already linked elsewhere' });
        customer.googleSub = identity.sub;
        if (identity.authoritative) customer.emailVerified = true;
        await customer.save();
        return res.json({ token: tokenFor(customer), customer: profileFor(customer) });
    } catch (error) { return res.status(401).json({ message: error.message || 'Could not connect Google' }); }
};

const requestEmailVerification = async (req, res) => {
    const customer = await Customer.findById(req.customer.id);
    if (!customer) return res.status(401).json({ message: 'Account not found' });
    if (customer.emailVerified) return res.json({ message: 'Email already verified' });
    const code = crypto.randomInt(100000, 1000000).toString();
    try {
        const sent = await sendVerificationCode(customer.email, code);
        if (!sent) return res.status(503).json({ message: 'Email verification is unavailable until SMTP is configured. You can still use your account and view new orders.' });
        customer.verificationCodeHash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(code).digest('hex');
        customer.verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        customer.verificationAttempts = 0;
        await customer.save();
        return res.json({ message: 'Verification code sent' });
    } catch (_error) { return res.status(502).json({ message: 'Could not send verification email' }); }
};

const confirmEmailVerification = async (req, res) => {
    const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
    if (!/^\d{6}$/.test(code)) return res.status(400).json({ message: 'Enter the six-digit code' });
    const customer = await Customer.findById(req.customer.id).select('+verificationCodeHash +verificationExpiresAt +verificationAttempts');
    if (!customer) return res.status(401).json({ message: 'Account not found' });
    if (customer.emailVerified) return res.json({ customer: profileFor(customer) });
    if (!customer.verificationCodeHash || !customer.verificationExpiresAt || customer.verificationExpiresAt < new Date() || customer.verificationAttempts >= 5) return res.status(400).json({ message: 'Code expired. Request a new one.' });
    const hash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(code).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(customer.verificationCodeHash, 'hex'))) {
        customer.verificationAttempts += 1;
        await customer.save();
        return res.status(400).json({ message: 'Incorrect code' });
    }
    customer.emailVerified = true;
    customer.verificationCodeHash = undefined;
    customer.verificationExpiresAt = undefined;
    customer.verificationAttempts = 0;
    await customer.save();
    return res.json({ customer: profileFor(customer) });
};

const me = async (req, res) => {
    const customer = await Customer.findById(req.customer.id);
    return customer ? res.json({ customer: profileFor(customer) }) : res.status(401).json({ message: 'Account not found' });
};

module.exports = { register, login, googleLogin, linkGoogle, requestEmailVerification, confirmEmailVerification, me };
