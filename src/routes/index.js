import express from 'express';
import { uploadMiddleware, handleUpload } from '../controllers/uploadController.js';
import { getStatus } from '../controllers/statusController.js';

const router = express.Router();

router.post('/upload', uploadMiddleware, handleUpload);
router.get('/status/:requestId', getStatus);

export default router;
