const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../model/adminModel');

const login = async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.body.email?.trim().toLowerCase() });
        if (!admin || !await bcrypt.compare(req.body.password || '', admin.passwordHash)) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign(
            { id: admin._id.toString(), email: admin.email, name: admin.name, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        return res.status(200).json({ token, admin: { name: admin.name, email: admin.email } });
    } catch (_error) {
        return res.status(500).json({ message: 'Could not log in' });
    }
};

const me = (req, res) => res.status(200).json({ admin: req.admin });

module.exports = { login, me };
