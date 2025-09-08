import jwt from 'jsonwebtoken';
import pool from '../database/database.js';

/**
 * Obtiene el token de la request desde múltiples fuentes
 * con seguridad mejorada para query parameters
 */
export const getTokenFromRequest = (req) => {
  let tokenSource = 'none';
  let token = null;

  // 1. Cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    tokenSource = 'cookie';
    
    // Log de auditoría para cookies
    if (process.env.NODE_ENV === 'production') {
      console.log(`Audit: Token obtenido desde cookies - Ruta: ${req.path}, IP: ${req.ip}`);
    }
  }
  // 2. Headers Authorization (estándar para APIs)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
    tokenSource = 'authorization_header';
    
    // Log de auditoría para headers
    if (process.env.NODE_ENV === 'production') {
      console.log(`Audit: Token obtenido desde headers - Ruta: ${req.path}, IP: ${req.ip}`);
    }
  }
  // 3. Query parameters
  else if (req.query && req.query.token) {
    // Solo permitir query tokens en endpoints específicos no sensibles
    const allowedPaths = [
      '/api/auth/password-reset',
      '/api/auth/verify-email',
      '/api/auth/confirm-email'
    ];
    
    const isAllowedPath = allowedPaths.some(path => req.path.startsWith(path));
    const isGetRequest = req.method === 'GET';
    
    if (isAllowedPath && isGetRequest) {
      token = req.query.token;
      tokenSource = 'query_param';
      
      // LOG DE AUDITORÍA CRÍTICO - Tokens en query params
      console.warn(`SECURITY AUDIT: Token en query parameter - Ruta: ${req.path}, IP: ${req.ip}, Método: ${req.method}, User-Agent: ${req.get('User-Agent')}`);
    } else {
      // Log de intento no autorizado de usar query token
      console.warn(`SECURITY WARNING: Intento no autorizado de usar query token - Ruta: ${req.path}, IP: ${req.ip}, Método: ${req.method}`);
      return null;
    }
  }

  // Log para debugging (desarrollo)
  if (process.env.NODE_ENV === 'development' && token) {
    console.log(`Debug: Token obtenido desde: ${tokenSource}, Ruta: ${req.path}`);
  }

  return token;
};

/**
 * Middleware de autenticación requerida
 * Verifica el token y el usuario, setea la información del usuario dentro de req.user, y ejecuta next()
 */
export const authRequired = async (req, res, next) => {
  const startTime = Date.now();
  let token = null;
  
  try {
    token = getTokenFromRequest(req);
    
    if (!token) {
      // Log de intento de acceso sin token
      console.warn(`AUTH FAIL: No token provided - IP: ${req.ip}, Path: ${req.path}, Method: ${req.method}`);
      
      return res.status(401).json({ 
        message: "No autorizado",
        code: "NO_TOKEN"
      });
    }

    // VALIDACIÓN ADICIONAL DEL TOKEN
    
    // 1. Validar longitud mínima
    if (token.length < 50) {
      console.warn(`AUTH FAIL: Token too short - Length: ${token.length}, IP: ${req.ip}`);
      return res.status(401).json({ 
        message: "Token inválido",
        code: "INVALID_TOKEN"
      });
    }

    // 2. Validar formato básico
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn(`AUTH FAIL: Invalid token format - Parts: ${tokenParts.length}, IP: ${req.ip}`);
      return res.status(401).json({ 
        message: "Token inválido",
        code: "INVALID_TOKEN_FORMAT"
      });
    }

    // 3. Validar que cada parte sea base64 válido
    try {
      // Verificar que se pueden decodear las partes (aunque no usemos el contenido)
      Buffer.from(tokenParts[0], 'base64').toString();
      Buffer.from(tokenParts[1], 'base64').toString();
      // No decodemos la firma (parte 3) porque es binary data
    } catch (base64Error) {
      console.warn(`AUTH FAIL: Invalid base64 in token - IP: ${req.ip}`);
      return res.status(401).json({ 
        message: "Token inválido",
        code: "INVALID_TOKEN_ENCODING"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validación adicional del payload del token
    if (!decoded.id) {
      console.warn(`AUTH FAIL: Token missing user ID - IP: ${req.ip}`);
      return res.status(401).json({ 
        message: "Token inválido",
        code: "INVALID_TOKEN_PAYLOAD"
      });
    }

    if (!decoded.iat || typeof decoded.iat !== 'number') {
      console.warn(`AUTH FAIL: Token missing iat - IP: ${req.ip}`);
      return res.status(401).json({ 
        message: "Token inválido",
        code: "INVALID_TOKEN_TIMESTAMP"
      });
    }

    // Log de éxito en validación básica
    console.log(`AUTH SUCCESS: Token validated - User ID: ${decoded.id}, IP: ${req.ip}`);

    const [user] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    
    if (!user) {
      console.warn(`AUTH FAIL: User not found - User ID: ${decoded.id}, IP: ${req.ip}`);
      return res.status(401).json({ 
        message: "Usuario no existe",
        code: "USER_NOT_FOUND"
      });
    }

    if (!user[0].active) {
      console.warn(`AUTH FAIL: User inactive - User ID: ${decoded.id}, IP: ${req.ip}`);
      return res.status(401).json({ 
        message: "Usuario desactivado",
        code: "USER_INACTIVE"
      });
    }

    req.user = user[0];
    
    // Log de autenticación exitosa
    const processingTime = Date.now() - startTime;
    console.log(`AUTH COMPLETE: User ${decoded.id} authenticated - Time: ${processingTime}ms, IP: ${req.ip}`);
    
    next();
  } catch (error) {
    const errorDetails = {
      error: error.name,
      message: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip,
      tokenPresent: !!token,
      tokenLength: token ? token.length : 0,
      userAgent: req.get('User-Agent')
    };

    console.error('AUTH ERROR:', errorDetails);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Token expirado",
        code: "TOKEN_EXPIRED"
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Token inválido",
        code: "INVALID_TOKEN_SIGNATURE"
      });
    }

    return res.status(401).json({ 
      message: "Token inválido",
      code: "INVALID_TOKEN"
    });
  }
};

/**
 * Middleware para verificar roles de usuario
 */
export const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.user.rol)) {
      // Log de intento de acceso no autorizado por roles
      console.warn(`ROLE FAIL: User ${req.user.id} with role ${req.user.rol} attempted access to ${req.path}, Required roles: ${rolesPermitidos.join(', ')}, IP: ${req.ip}`);
      
      return res.status(403).json({ 
        message: "Acceso no autorizado",
        code: "UNAUTHORIZED_ACCESS"
      });
    }

    // Log de acceso autorizado por rol
    console.log(`ROLE SUCCESS: User ${req.user.id} with role ${req.user.rol} accessed ${req.path}, IP: ${req.ip}`);
    
    next();
  };
};