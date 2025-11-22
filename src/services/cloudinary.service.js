import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolver ruta absoluta a .env.local (raíz del backend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../../.env.local');

// Cargar variables desde .env.local en desarrollo sin sobreescribir las ya definidas
dotenv.config({ path: envPath, override: false });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function uploadImageBuffer(buffer, { folder, publicId, overwrite = true } = {}) {
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary no configurado');
  return new Promise((resolve, reject) => {
    const options = { folder, public_id: publicId, overwrite, resource_type: 'image' };
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    uploadStream.end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary no configurado');
  return cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: 'image' });
}
