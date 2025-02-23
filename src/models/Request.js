// src/models/Request.js
import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    products: [{
        serialNumber: Number,
        productName: String,
        inputUrls: [String],
        outputUrls: [String]  // Simplified to just store URLs
    }],
    webhookUrl: String,
    progress: {
        total: Number,
        completed: {
            type: Number,
            default: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Request', requestSchema);