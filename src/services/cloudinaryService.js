import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = async (buffer) => {
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'image-processor',
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result.secure_url); // Only return the URL
                }
            );

            uploadStream.end(buffer);
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};