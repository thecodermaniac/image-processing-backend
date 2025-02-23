import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api', routes);

connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));