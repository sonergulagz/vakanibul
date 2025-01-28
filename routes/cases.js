const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Case = require('../models/Case');
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');

// Vaka listeleme sayfası
router.get('/', async (req, res) => {
    try {
        const cases = await Case.find()
            .populate('publisher', 'name')
            .sort('-createdAt');

        // cases array'ini map ederek publisher._id'yi string'e çevirelim
        const formattedCases = cases.map(case_ => ({
            ...case_._doc,
            publisher: {
                ...case_.publisher._doc,
                _id: case_.publisher._id.toString()
            }
        }));

        res.render('cases/index', { 
            cases: formattedCases,
            user: res.locals.user
        });
    } catch (error) {
        console.error('Vaka listesi hatası:', error);
        res.status(500).render('error', {
            user: res.locals.user,
            error: 'Vakalar yüklenirken bir hata oluştu'
        });
    }
});

// Yeni vaka oluşturma sayfası
router.get('/new', auth, (req, res) => {
    res.render('cases/new');
});

// Vaka oluşturma
router.post('/', auth, async (req, res) => {
    try {
        const { 
            title, type, location, date, time, price, 
            priceType, experience, description, requirements 
        } = req.body;

        const newCase = new Case({
            title,
            type,
            location,
            date,
            time,
            price: Number(price),
            priceType,
            experience: Number(experience),
            description,
            requirements,
            publisher: req.session.userId
        });

        await newCase.save();
        res.redirect('/cases');
    } catch (error) {
        console.error('Vaka oluşturma hatası:', error);
        res.render('cases/new', {
            error: 'Vaka oluşturulurken bir hata oluştu',
            values: req.body
        });
    }
});

// Vaka detay sayfası
router.get('/:id', async (req, res) => {
    try {
        // Geçerli bir MongoDB ObjectId olup olmadığını kontrol et
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).render('404', { 
                user: res.locals.user,
                error: 'Geçersiz vaka ID'
            });
        }

        // populate() ile publisher bilgilerini al
        const case_ = await Case.findById(req.params.id)
            .populate({
                path: 'publisher',
                select: 'name email phone profileImage title location'
            });
        
        if (!case_) {
            return res.status(404).render('404', { 
                user: res.locals.user,
                error: 'Vaka bulunamadı'
            });
        }

        // Konsola vaka bilgilerini yazdır (hata ayıklama için)
        console.log('Bulunan vaka:', case_);

        res.render('cases/show', { 
            user: res.locals.user,
            case_: case_ // Değişken adını case_ olarak değiştirdik
        });

    } catch (error) {
        console.error('Vaka detay hatası:', error);
        res.status(500).render('error', {
            user: res.locals.user,
            error: 'Vaka detayları yüklenirken bir hata oluştu'
        });
    }
});

// Vaka durumu güncelleme
router.post('/:id/status', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Geçerli bir status değeri mi kontrol et
        const validStatuses = ['active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Geçersiz durum değeri' });
        }

        const case_ = await Case.findById(id);
        if (!case_) {
            return res.status(404).json({ error: 'Vaka bulunamadı' });
        }

        // Yalnızca vaka sahibi güncelleyebilir
        if (case_.publisher.toString() !== req.session.userId) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }

        case_.status = status;
        await case_.save();

        res.json({ 
            message: 'Vaka durumu güncellendi',
            newStatus: status 
        });
    } catch (error) {
        console.error('Durum güncelleme hatası:', error);
        res.status(500).json({ error: 'Durum güncellenirken bir hata oluştu' });
    }
});

// Vakaya başvurma
router.post('/:id/apply', auth, async (req, res) => {
    try {
        const case_ = await Case.findById(req.params.id);
        
        if (!case_) {
            return res.status(404).json({ error: 'Vaka bulunamadı' });
        }

        if (case_.status !== 'active') {
            return res.status(400).json({ error: 'Bu vaka artık aktif değil' });
        }

        if (case_.publisher.toString() === req.session.userId) {
            return res.status(400).json({ error: 'Kendi vakanıza başvuramazsınız' });
        }

        // Daha önce başvuru yapılmış mı kontrol et
        const existingApplication = case_.applicants.find(
            app => app.user.toString() === req.session.userId
        );

        if (existingApplication) {
            return res.status(400).json({ error: 'Bu vakaya zaten başvurdunuz' });
        }

        // Başvuruyu ekle
        case_.applicants.push({
            user: req.session.userId,
            status: 'pending'
        });

        await case_.save();

        // Otomatik olarak randevu oluştur
        const appointment = new Appointment({
            case: case_._id,
            doctor: req.session.userId,
            client: case_.publisher,
            date: case_.date,
            time: case_.time,
            status: 'pending'
        });

        await appointment.save();

        res.json({ message: 'Başvurunuz başarıyla alındı' });
    } catch (error) {
        console.error('Başvuru hatası:', error);
        res.status(500).json({ error: 'Başvuru yapılırken bir hata oluştu' });
    }
});

module.exports = router; 