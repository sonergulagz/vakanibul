const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

// Randevuları listeleme
router.get('/', auth, async (req, res) => {
    try {
        // Kullanıcının hem doktor hem de müşteri olarak olduğu randevuları getir
        const appointments = await Appointment.find({
            $or: [
                { doctor: req.session.userId },
                { client: req.session.userId }
            ]
        })
        .populate('case', 'title type location')
        .populate('doctor', 'name profileImage')
        .populate('client', 'name profileImage')
        .sort('-createdAt');

        res.render('appointments/index', {
            user: res.locals.user,
            appointments: appointments
        });
    } catch (error) {
        console.error('Randevu listesi hatası:', error);
        res.status(500).render('error', {
            user: res.locals.user,
            error: 'Randevular yüklenirken bir hata oluştu'
        });
    }
});

// Yeni randevu oluşturma sayfası
router.get('/new', auth, (req, res) => {
    res.render('appointments/new');
});

// Randevu oluşturma
router.post('/', auth, async (req, res) => {
    try {
        const { 
            title, type, location, date, time, price, 
            priceType, experience, description, requirements 
        } = req.body;

        const newAppointment = new Appointment({
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

        await newAppointment.save();
        res.redirect('/appointments');
    } catch (error) {
        console.error('Randevu oluşturma hatası:', error);
        res.render('appointments/new', {
            error: 'Randevu oluşturulurken bir hata oluştu',
            values: req.body
        });
    }
});

// Randevu detay sayfası
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).render('404', { 
                error: 'Geçersiz randevu ID'
            });
        }

        const appointment = await Appointment.findById(req.params.id)
            .populate('publisher', 'name email phone profileImage title location');
        
        if (!appointment) {
            return res.status(404).render('404', { 
                user: res.locals.user,
                error: 'Randevu bulunamadı'
            });
        }

        res.render('appointments/show', { 
            user: res.locals.user,
            appointment: appointment
        });
    } catch (error) {
        console.error('Randevu detay hatası:', error);
        res.status(500).render('error', {
            user: res.locals.user,
            error: 'Randevu detayları yüklenirken bir hata oluştu'
        });
    }
});

// Randevu durumu güncelleme
router.post('/:id/status', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ error: 'Randevu bulunamadı' });
        }

        // Sadece ilgili kişiler randevu durumunu güncelleyebilir
        if (appointment.doctor.toString() !== req.session.userId && 
            appointment.client.toString() !== req.session.userId) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }

        appointment.status = status;
        await appointment.save();

        res.json({ message: 'Randevu durumu güncellendi' });
    } catch (error) {
        console.error('Randevu güncelleme hatası:', error);
        res.status(500).json({ error: 'Randevu güncellenirken bir hata oluştu' });
    }
});

module.exports = router; 