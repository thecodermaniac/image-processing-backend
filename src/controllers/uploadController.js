import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { processCSV } from '../services/csvProcessor.js';
import { imageQueue } from '../queues/imageQueue.js';
import Request from '../models/Request.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
});

export const uploadMiddleware = upload.single('file');

export const handleUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No CSV file uploaded' });
        }

        const requestId = uuidv4();
        const webhookUrl = req.body.webhookUrl;

        // Process CSV
        const { records, totalImages } = await processCSV(req.file.buffer);

        if (records.length === 0) {
            return res.status(400).json({ error: 'No valid records found in CSV' });
        }

        // Create request document
        const request = await Request.create({
            requestId,
            status: 'processing',
            products: records,
            webhookUrl,
            progress: {
                total: totalImages,
                completed: 0
            }
        });

        // Add jobs to queue
        const queuePromises = [];
        for (const product of records) {
            for (const url of product.inputUrls) {
                queuePromises.push(
                    imageQueue.add('processImage', {
                        requestId,
                        url,
                        productName: product.productName
                    }, {
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 1000
                        }
                    })
                );
            }
        }

        await Promise.all(queuePromises);

        res.status(200).json({
            requestId,
            message: 'Upload successful, processing started',
            totalImages,
            status: 'processing'
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Upload failed',
            message: error.message
        });
    }
};