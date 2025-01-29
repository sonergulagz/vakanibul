const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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
        console.log('Login attempt:', { email, timestamp: new Date().toISOString() });

        // Kullanıcıyı bul
        const user = await User.findOne({ email });
        console.log('User lookup result:', {
            found: !!user,
            userId: user?._id,
            timestamp: new Date().toISOString()
        });

        if (!user) {
            console.log('Login failed: User not found');
            return res.render('auth/login', {
                error: 'Email veya şifre hatalı',
                values: { email }
            });
        }

        // Şifre kontrolü
        try {
            const isMatch = await user.comparePassword(password);
            console.log('Password verification:', {
                userId: user._id,
                isMatch,
                timestamp: new Date().toISOString()
            });

            if (!isMatch) {
                console.log('Login failed: Password mismatch');
                return res.render('auth/login', {
                    error: 'Email veya şifre hatalı',
                    values: { email }
                });
            }

            // Session'a kullanıcı bilgisini kaydet
            req.session.userId = user._id;
            console.log('Session created:', {
                userId: user._id,
                timestamp: new Date().toISOString()
            });

            res.redirect('/');

        } catch (passwordError) {
            console.error('Password verification error:', {
                name: passwordError.name,
                message: passwordError.message,
                stack: passwordError.stack
            });
            throw passwordError;
        }

    } catch (error) {
        console.error('Login error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        res.render('auth/login', {
            error: 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.',
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