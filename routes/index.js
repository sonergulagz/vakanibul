const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');

router.get('/', async (req, res) => {
    try {
        const doctors = await Doctor.find()
            .sort({ rating: -1 })
            .limit(6);
        
        res.render('home', { 
            doctors,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Ana sayfa yüklenirken hata:', error);
        res.status(500).send('Bir hata oluştu');
    }
});

router.get('/search', async (req, res) => {
    try {
        const { city, date, minPrice, maxPrice, experience, rating } = req.query;
        let query = {};
        
        if (city) {
            query.city = new RegExp(city, 'i');
        }
        
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        
        if (experience) {
            query.experience = { $gte: Number(experience) };
        }
        
        if (rating) {
            query.rating = { $gte: Number(rating) };
        }
        
        const doctors = await Doctor.find(query)
            .sort({ rating: -1, experience: -1 });
        
        res.render('search-results', { 
            doctors,
            searchParams: { city, date, minPrice, maxPrice, experience, rating },
            user: req.session.user
        });
    } catch (error) {
        console.error('Arama yapılırken hata:', error);
        res.status(500).send('Arama sırasında bir hata oluştu');
    }
});

module.exports = router; 