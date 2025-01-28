const User = require('../models/User');

async function auth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
            return res.redirect('/auth/login');
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware hatası:', error);
        res.status(500).send('Bir hata oluştu');
    }
}

module.exports = auth; 