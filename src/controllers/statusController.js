import Request from '../models/Request.js';

export const getStatus = async (req, res) => {
    try {
        const request = await Request.findOne({ requestId: req.params.requestId });

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const response = {
            requestId: request.requestId,
            status: request.status,
            progress: {
                completed: request.progress.completed,
                total: request.progress.total,
                percentage: Math.round((request.progress.completed / request.progress.total) * 100)
            },
            products: request.products.map(product => ({
                serialNumber: product.serialNumber,
                productName: product.productName,
                inputUrls: product.inputUrls,
                outputUrls: product.outputUrls
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Status check failed' });
    }
};