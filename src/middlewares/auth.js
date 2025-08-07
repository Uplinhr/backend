import jwt from 'jsonwebtoken';
import pool from '../database.js';

export const authRequired = async (req, res, next) => {
  const { token } = req.cookies;
  
  if (!token) return res.status(401).json({ message: "No autorizado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [user] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    
    if (!user) return res.status(401).json({ message: "Usuario no existe" });

    req.user = user[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

export const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: "Acceso no autorizado" });
    }
    next();
  };
};