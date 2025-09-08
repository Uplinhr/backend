import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Crea y configura la conexión con la base de datos MySQL
 * @constant
 * @type {mysql.Pool}
 * 1. **Configuración básica de conexión**:
 *    - @param {string} host - Host de la base de datos (DB_HOST)
 *    - @param {number} port - Puerto de la base de datos (DB_PORT)
 *    - @param {string} user - Usuario de la base de datos (DB_USER)
 *    - @param {string} password - Contraseña de la base de datos (DB_PASSWORD)
 *    - @param {string} database - Nombre de la base de datos (DB_NAME)
 * 
 * 2. **Configuración del pool**:
 *    - @param {boolean} waitForConnections - Esperar por conexiones disponibles si el límite se alcanza
 *    - @param {number} connectionLimit - Número máximo de conexiones simultáneas (10)
 *    - @param {number} queueLimit - Límite de solicitudes en cola (0 = ilimitado)
 *    - @param {number} connectTimeout - Timeout de conexión en milisegundos (60000 = 60 segundos)
 * 
 * @advantages
 * - **Pooling**: Reutiliza conexiones existentes en lugar de crear nuevas
 * - **Eficiencia**: Mejora el rendimiento en aplicaciones con alta concurrencia
 * - **Gestión automática**: Maneja automáticamente la creación y destrucción de conexiones
 * - **Escalabilidad**: Permite múltiples operaciones simultáneas dentro de los límites establecidos
 * 
 * @security
 * - Todas las credenciales se obtienen de variables de entorno
 * - Nunca se hardcodean credenciales en el código
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000
});

export default pool;