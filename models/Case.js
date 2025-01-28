const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['DHI_SPECIALIST', 'FUE_SPECIALIST', 'COLLECTOR', 'PLANTER']
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    priceType: {
        type: String,
        enum: ['PER_HOUR', 'PER_DAY', 'FIXED'],
        required: true
    },
    experience: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    requirements: {
        type: String
    },
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    applicants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Case', caseSchema); 