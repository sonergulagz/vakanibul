const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Yeni mesaj sayfası
router.get('/new/:userId', auth, async (req, res) => {
    try {
        const receiverId = req.params.userId;
        const caseId = req.query.case;
        
        res.render('messages/new', {
            user: res.locals.user,
            receiverId,
            caseId
        });
    } catch (error) {
        console.error('Mesaj sayfası hatası:', error);
        res.status(500).render('error', {
            user: res.locals.user,
            error: 'Mesaj sayfası yüklenirken bir hata oluştu'
        });
    }
});

// Mesaj gönderme
router.post('/', auth, async (req, res) => {
    try {
        const { receiverId, caseId, content } = req.body;

        const newMessage = new Message({
            sender: req.session.userId,
            receiver: receiverId,
            case: caseId,
            content
        });

        await newMessage.save();

        res.redirect('/messages');
    } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        res.status(500).render('error', {
            user: res.locals.user,
            error: 'Mesaj gönderilirken bir hata oluştu'
        });
    }
});

// Mesajları listeleme
router.get('/', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.session.userId },
                { receiver: req.session.userId }
            ]
        })
        .populate('sender', 'name profileImage')
        .populate('receiver', 'name profileImage')
        .populate('case', 'title')
        .sort('-createdAt');

        res.render('messages/index', {
            user: res.locals.user,
            messages
        });
    } catch (error) {
        console.error('Mesaj listesi hatası:', error);
        res.status(500).render('error', {
            user: res.locals.user,
            error: 'Mesajlar yüklenirken bir hata oluştu'
        });
    }
});

module.exports = router; 