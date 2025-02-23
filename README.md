# Image Processing Service

A Node.js service that processes images in bulk from CSV files, uploads them to Cloudinary, and stores the processed image URLs in MongoDB.

## Table of Contents
- [Image Processing Service](#image-processing-service)
  - [Table of Contents](#table-of-contents)
  - [FlowChart](#flowchart)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [API Documentation](#api-documentation)
    - [Upload CSV](#upload-csv)
    - [Check Status](#check-status)
  - [Worker Documentation](#worker-documentation)
    - [Image Processing Worker](#image-processing-worker)
  - [CSV Format](#csv-format)
  - [Database Schema](#database-schema)
    - [Request Model](#request-model)
  - [Error Handling](#error-handling)
    - [File Upload Errors](#file-upload-errors)
    - [Processing Errors](#processing-errors)
    - [Queue Errors](#queue-errors)
    - [Database Errors](#database-errors)
  - [Example Usage](#example-usage)
    - [Using cURL](#using-curl)
    - [Using Node.js](#using-nodejs)
  - [Contributing](#contributing)
  - [License](#license)

## FlowChart
![diagram-export-2-23-2025-8_31_19-PM](https://github.com/user-attachments/assets/674afccb-3147-4441-b585-ea8af83f071d)
## Features
- Bulk image processing from CSV files
- Cloudinary integration for image storage
- MongoDB for request tracking
- Redis-based job queue
- Progress tracking
- Webhook notifications
- Asynchronous processing

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Redis
- Cloudinary account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd image-processing-service
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see [Environment Variables](#environment-variables) section)

4. Start the server:
```bash
npm run dev  # Development mode
npm start    # Production mode
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/image-processor
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
REDIS_PASSWORD=your-redis-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## API Documentation

### Upload CSV
Process images from a CSV file.

```http
POST /api/upload
```

**Request:**
- Content-Type: multipart/form-data
- Body:
  - file: CSV file (required)
  - webhookUrl: URL for completion notification (optional)

**Response:**
```json
{
  "requestId": "uuid-string",
  "message": "Upload successful, processing started",
  "totalImages": 10,
  "status": "processing"
}
```

### Check Status
Get the processing status of a request.

```http
GET /api/status/:requestId
```

**Response:**
```json
{
  "requestId": "uuid-string",
  "status": "completed",
  "progress": {
    "completed": 10,
    "total": 10,
    "percentage": 100
  },
  "products": [
    {
      "serialNumber": 1,
      "productName": "Product A",
      "inputUrls": ["http://example.com/image1.jpg"],
      "outputUrls": ["https://res.cloudinary.com/..."]
    }
  ]
}
```

## Worker Documentation

### Image Processing Worker
Handles the processing of individual images.

```javascript
// Queue Configuration
const imageQueue = new Queue('imageProcessing', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

// Worker Configuration
const imageWorker = new Worker('imageProcessing', 
  async (job) => {
    const { requestId, url, productName } = job.data;
    return await processImage(requestId, url, productName);
  },
  {
    concurrency: 5
  }
);
```

**Worker Process:**
1. Downloads image from source URL
2. Processes image using Sharp
3. Uploads to Cloudinary
4. Updates MongoDB with new URL
5. Updates progress tracking

**Error Handling:**
- Automatic retry for failed jobs (3 attempts)
- Exponential backoff between retries
- Error logging and status updates

## CSV Format

The CSV file should follow this format:

```csv
S. No.,Product Name,Input Image Urls
1,Product A,http://example.com/image1.jpg;http://example.com/image2.jpg
2,Product B,http://example.com/image3.jpg
```

**Notes:**
- Multiple image URLs should be separated by comma
- Headers are required
- All fields are required

## Database Schema

### Request Model
```javascript
{
  requestId: String,
  status: String, // pending, processing, completed, failed
  products: [{
    serialNumber: Number,
    productName: String,
    inputUrls: [String],
    outputUrls: [String]
  }],
  webhookUrl: String,
  progress: {
    total: Number,
    completed: Number
  },
  createdAt: Date
}
```

## Error Handling

The service includes comprehensive error handling:

### File Upload Errors
- Invalid file format
- File size limits
- Missing file

### Processing Errors
- Invalid image URLs
- Download failures
- Processing failures
- Upload failures

### Queue Errors
- Job failures
- Redis connection issues

### Database Errors
- Connection failures
- Query errors

All errors are logged and appropriate HTTP status codes are returned.

## Example Usage

### Using cURL

1. Upload CSV file:
```bash
curl -X POST \
  -F "file=@products.csv" \
  -F "webhookUrl=http://your-webhook-url.com" \
  http://localhost:3000/api/upload
```

2. Check processing status:
```bash
curl http://localhost:3000/api/status/your-request-id
```

### Using Node.js

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function uploadCSV() {
  const formData = new FormData();
  formData.append('file', fs.createReadStream('products.csv'));
  formData.append('webhookUrl', 'http://your-webhook-url.com');

  try {
    const response = await axios.post('http://localhost:3000/api/upload', formData, {
      headers: formData.getHeaders()
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
