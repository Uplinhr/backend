/**
 * Middleware básico de autenticación para rutas administrativas
 * Por simplicidad, usa autenticación básica HTTP
 *
 * Para producción, implementar autenticación JWT completa
 */

// Credenciales básicas para desarrollo (usuario: admin, contraseña: admin123)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

/**
 * Middleware de autenticación básica para rutas administrativas
 */
export const basicAuth = (req, res, next) => {
  // Si estamos en desarrollo, permitir acceso sin autenticación
  if (process.env.DEV === 'true') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Autenticación requerida para acceder a rutas administrativas'
      }
    });
  }

  try {
    // Decodificar credenciales base64
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Verificar credenciales
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      return next();
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas'
      }
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Error procesando autenticación'
      }
    });
  }
};

/**
 * Middleware para verificar permisos de administrador
 * Por ahora solo verifica autenticación básica
 * En producción, verificar roles de usuario en la base de datos
 */
export const requireAdmin = (req, res, next) => {
  // Aquí puedes agregar lógica adicional para verificar permisos específicos
  // Por ejemplo, consultar la base de datos para verificar si el usuario tiene rol de admin

  return basicAuth(req, res, next);
};
