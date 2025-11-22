import multer from 'multer';
import prisma from '../../database/prisma.js';
import { uploadImageBuffer, deleteImage } from '../../services/cloudinary.service.js';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Formato no permitido. Use JPG, PNG o WEBP'));
    }
    cb(null, true);
  },
});

// Resuelve el usuario autenticado tanto para sesiones Auth0 como para JWT local
const resolveAvatarUser = async (req) => {
  // Caso Auth0: req.auth.payload.sub -> user.auth0Id
  const claims = req.auth?.payload;
  if (claims?.sub) {
    const user = await prisma.user.findFirst({ where: { auth0Id: claims.sub } });
    return { user, source: 'auth0' };
  }

  // Caso login clásico: authRequired deja el usuario en req.user
  if (req.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: String(req.user.id) } });
    return { user, source: 'local' };
  }

  return { user: null, source: 'none' };
};

export const uploadAvatar = async (req, res) => {
  try {
    const { user, source } = await resolveAvatarUser(req);
    if (!user) {
      const status = source === 'none' ? 401 : 404;
      const error = source === 'none' ? 'Unauthorized' : 'User not found';
      return res.status(status).json({ success: false, error });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'Archivo requerido (campo "file")' });

    const folderRoot = process.env.CLOUDINARY_FOLDER || 'avatars';
    const folder = `${folderRoot}/${user.id}`;

    // Eliminar avatar previo para evitar acumulación de versiones
    try { await deleteImage(`${folder}/avatar`); } catch (_) {}

    const result = await uploadImageBuffer(file.buffer, { folder, publicId: 'avatar', overwrite: true });

    const updated = await prisma.user.update({ where: { id: user.id }, data: { pictureUrl: result.secure_url } });

    return res.status(200).json({ success: true, data: { pictureUrl: updated.pictureUrl, publicId: result.public_id } });
  } catch (err) {
    const msg = /File too large/i.test(err?.message) ? 'La imagen supera el tamaño máximo permitido (2MB)' : err.message;
    return res.status(400).json({ success: false, error: msg });
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    const { user, source } = await resolveAvatarUser(req);
    if (!user) {
      const status = source === 'none' ? 401 : 404;
      const error = source === 'none' ? 'Unauthorized' : 'User not found';
      return res.status(status).json({ success: false, error });
    }

    const folderRoot = process.env.CLOUDINARY_FOLDER || 'avatars';
    const publicId = `${folderRoot}/${user.id}/avatar`;
    try { await deleteImage(publicId); } catch (_) {}

    const updated = await prisma.user.update({ where: { id: user.id }, data: { pictureUrl: null } });
    return res.status(200).json({ success: true, data: { pictureUrl: updated.pictureUrl } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
