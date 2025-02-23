import { Queue, Worker } from 'bullmq';
import { processImage } from '../services/imageProcessor.js';
import dotenv from 'dotenv';

dotenv.config();
const connection = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    username: "default"
};

export const imageQueue = new Queue('imageProcessing', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        }
    }
});

export const imageWorker = new Worker('imageProcessing',
    async (job) => {
        const { requestId, url, productName } = job.data;
        return await processImage(requestId, url, productName);
    },
    {
        connection,
        concurrency: 5
    }
);

imageWorker.on('completed', async (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

imageWorker.on('failed', async (job, error) => {
    console.error(`Job ${job.id} failed:`, error);
});