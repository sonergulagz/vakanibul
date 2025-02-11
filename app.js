const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const authRouter = require('./routes/auth');
const casesRouter = require('./routes/cases');
const profileRouter = require('./routes/profile');
const appointmentsRouter = require('./routes/appointments');
const messagesRouter = require('./routes/messages');
const User = require('./models/User');
const hospitals = require('./data/hospitals');
const cors = require('cors');
const app = express();

console.log('Uygulama başlatılıyor...');

// View engine ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'sacekimigizlianahtar',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Path middleware
app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
});

// User middleware
app.use(async (req, res, next) => {
    res.locals.user = null;
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            res.locals.user = user;
        } catch (error) {
            console.error('Kullanıcı bilgisi alınamadı:', error);
        }
    }
    next();
});

// CORS middleware ekle
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Test route
app.get('/test', (req, res) => {
    res.send('Test sayfası çalışıyor!');
});

// Ana sayfa route'u
app.get('/', async (req, res) => {
    try {
        const doctors = await User.find({
            title: { $ne: null }
        })
        .select('name title location profileImage')
        .limit(6);

        res.render('home', { 
            user: res.locals.user,
            doctors: doctors || [],
            hospitals: hospitals
        });
    } catch (error) {
        console.error('Ana sayfa hatası:', error);
        res.render('home', { 
            user: res.locals.user,
            doctors: [],
            hospitals: hospitals
        });
    }
});

// Nasıl Çalışır sayfası
app.get('/how-it-works', (req, res) => {
    res.render('how-it-works', {
        user: res.locals.user
    });
});

// Auth route'larını bağla
app.use('/auth', authRouter);

// Cases route'larını bağla
app.use('/cases', casesRouter);

// Profile route'larını bağla
app.use('/profile', profileRouter);

// Appointments route'larını bağla
app.use('/appointments', appointmentsRouter);

// Messages route'larını bağla
app.use('/messages', messagesRouter);

// Site başlığını güncelle
app.locals.siteName = 'VakanıBul';

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log('MongoDB bağlantısı başarılı');
    const maskedURI = process.env.MONGODB_URI.replace(
        /(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/,
        '$1****:****@'
    );
    console.log('MongoDB URI:', maskedURI);
})
.catch(err => {
    console.error('MongoDB bağlantı hatası:', {
        name: err.name,
        message: err.message,
        code: err.code
    });
});

// 404 sayfası
app.use((req, res) => {
    res.status(404).render('404', { user: res.locals.user });
});

// Hata yakalama
app.use((err, req, res, next) => {
    console.error('Uygulama hatası:', err);
    res.status(500).render('error', { 
        user: res.locals.user,
        error: 'Bir hata oluştu'
    });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
}); 