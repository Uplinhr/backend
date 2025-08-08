import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AuthModel from './model.js';

export const register = async (req, res) => {
  try {
    const {nombre, apellido, contrasenia, email, estado} = req.body;
    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    const result = await AuthModel.create(nombre, apellido, hashedPassword, email, estado)

    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token, { httpOnly: true });
    res.status(201).json({ message: "Usuario registrado" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "El email ya existe" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const user = await AuthModel.login(req.body.email)

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(req.body.contrasenia, user.contrasenia);
    if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token, { httpOnly: true, secure: !process.env.DEV });
    res.json({ message: "Sesión iniciada", user: { id: user.id, nombre: user.nombre, rol: user.rol } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: "Sesión cerrada" });
};