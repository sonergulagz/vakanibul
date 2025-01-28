const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Giriş sayfası
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// Kayıt sayfası
router.get('/register', (req, res) => {
    res.render('auth/register');
});

// Kayıt işlemi
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Email kontrolü
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('auth/register', {
                error: 'Bu email adresi zaten kullanılıyor',
                values: req.body
            });
        }

        // Yeni kullanıcı oluştur
        const user = new User({
            name,
            email,
            password,
            phone
        });

        await user.save();
        
        // Otomatik giriş yap
        req.session.userId = user._id;
        res.redirect('/');

    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.render('auth/register', {
            error: 'Kayıt sırasında bir hata oluştu',
            values: req.body
        });
    }
});

// Giriş işlemi
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kullanıcıyı bul
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', {
                error: 'Email veya şifre hatalı',
                values: { email }
            });
        }

        // Şifre kontrolü
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('auth/login', {
                error: 'Email veya şifre hatalı',
                values: { email }
            });
        }

        // Session'a kullanıcı bilgisini kaydet
        req.session.userId = user._id;
        res.redirect('/');

    } catch (error) {
        console.error('Giriş hatası:', error);
        res.render('auth/login', {
            error: 'Giriş sırasında bir hata oluştu',
            values: req.body
        });
    }
});

// Çıkış işlemi
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router; 