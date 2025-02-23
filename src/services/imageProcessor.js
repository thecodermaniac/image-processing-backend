// src/services/imageProcessor.js
import sharp from 'sharp';
import axios from 'axios';
import Request from '../models/Request.js';
import { uploadToCloudinary } from './cloudinaryService.js';

export const processImage = async (requestId, inputUrl, productName) => {
    try {
        // Download image
        const response = await axios.get(inputUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
        });

        const buffer = Buffer.from(response.data);

        // Process image with Sharp
        const processedBuffer = await sharp(buffer)
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Upload to Cloudinary and get URL
        const cloudinaryUrl = await uploadToCloudinary(processedBuffer);

        // Update database
        const request = await Request.findOne({ requestId });
        if (!request) {
            throw new Error('Request not found');
        }

        const product = request.products.find(p => p.productName === productName);
        if (!product) {
            throw new Error('Product not found in request');
        }

        // Simply push the URL
        product.outputUrls.push(cloudinaryUrl);
        request.progress.completed += 1;

        // Check if processing is complete
        if (request.progress.completed === request.progress.total) {
            request.status = 'completed';
            await triggerWebhook(request);
        }

        await request.save();
        return cloudinaryUrl;

    } catch (error) {
        await handleProcessingError(requestId, error);
        throw error;
    }
};

const handleProcessingError = async (requestId, error) => {
    try {
        const request = await Request.findOne({ requestId });
        if (request) {
            request.status = 'failed';
            await request.save();
        }
        console.error('Image processing error:', error);
    } catch (dbError) {
        console.error('Error updating request status:', dbError);
    }
};

const triggerWebhook = async (request) => {
    if (!request.webhookUrl) return;

    try {
        await axios.post(request.webhookUrl, {
            requestId: request.requestId,
            status: request.status,
            products: request.products,
            progress: request.progress
        }, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Webhook trigger error:', error);
    }
};