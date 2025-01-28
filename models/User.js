const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    profileImage: {
        type: String,
        default: '/images/default-avatar.png'
    },
    title: {
        type: String,
        default: null
    },
    bio: {
        type: String
    },
    specialties: [{
        type: String,
        enum: ['DHI', 'FUE', 'Safir FUE', 'Greft Toplama', 'Kanal Açma', 'Greft Yerleştirme']
    }],
    experience: {
        type: Number,
        min: 0
    },
    location: {
        type: String,
        default: null
    },
    certificates: [{
        name: String,
        issuer: String,
        year: Number
    }],
    socialMedia: {
        instagram: String,
        facebook: String,
        linkedin: String
    },
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Şifre hashleme
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Şifre kontrolü
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 