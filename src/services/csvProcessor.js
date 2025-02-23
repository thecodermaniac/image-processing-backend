import { parse } from 'csv-parse/sync'; // Note the /sync import

export const processCSV = async (buffer) => {
    try {
        const csvString = buffer.toString('utf-8');

        // Parse CSV synchronously
        const parsedRecords = parse(csvString, {
            delimiter: ',',
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        const records = [];
        let totalImages = 0;

        // Process each record
        for (const record of parsedRecords) {
            const inputUrls = record['Input Image Urls']
                .split(',')
                .map(url => url.trim())
                .filter(url => url.length > 0);

            if (inputUrls.length > 0) {
                totalImages += inputUrls.length;
                records.push({
                    serialNumber: parseInt(record['S. No.']),
                    productName: record['Product Name'],
                    inputUrls,
                    outputUrls: []
                });
            }
        }

        return { records, totalImages };
    } catch (error) {
        console.error('CSV Processing Error:', error);
        throw new Error(`Failed to process CSV: ${error.message}`);
    }
};