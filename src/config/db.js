import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export const createRedisClient = () => {
    const client = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        username: "default",
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    });

    client.on('error', (err) => console.error('Redis Client Error:', err));
    client.on('connect', () => console.log('Redis Client Connected'));

    return client;
};

export const redis = createRedisClient();
