const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer ayarları
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/profiles');
    },
    filename: function(req, file, cb) {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

// Dosya tipi kontrolü
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Hata: Sadece resim yükleyebilirsiniz!');
    }
}

// Profil sayfası
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render('profile/index', { user });
    } catch (error) {
        res.status(500).send('Bir hata oluştu');
    }
});

// Profil düzenleme sayfası
router.get('/edit', auth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render('profile/edit', { user });
    } catch (error) {
        res.status(500).send('Bir hata oluştu');
    }
});

// Profil güncelleme
router.post('/update', auth, upload.single('profileImage'), async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            phone: req.body.phone,
            title: req.body.title,
            bio: req.body.bio,
            specialties: req.body.specialties,
            experience: req.body.experience,
            location: req.body.location,
            'socialMedia.instagram': req.body.instagram,
            'socialMedia.facebook': req.body.facebook,
            'socialMedia.linkedin': req.body.linkedin
        };

        // Eğer yeni profil fotoğrafı yüklendiyse
        if (req.file) {
            updates.profileImage = '/uploads/profiles/' + req.file.filename;
        }

        const user = await User.findByIdAndUpdate(
            req.session.userId,
            { $set: updates },
            { new: true }
        );

        res.redirect('/profile');
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        res.render('profile/edit', {
            error: 'Profil güncellenirken bir hata oluştu',
            user: req.body
        });
    }
});

module.exports = router; 