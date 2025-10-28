// src/database/migrate-users-to-prisma.js - Migrar usuarios de MySQL a Prisma
import { PrismaClient } from '../generated/prisma/index.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../config/logger.config.js';
import bcrypt from 'bcrypt';

dotenv.config();

const prisma = new PrismaClient();

// Conexión a MySQL
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'uplindb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
});

async function migrateUsers() {
  logger.info('🚀 Migrando usuarios de MySQL a Prisma...');

  try {
    // Obtener usuarios de MySQL
    const [users] = await mysqlPool.query('SELECT * FROM usuarios WHERE active = 1');

    logger.info(`📊 Encontrados ${users.length} usuarios activos en MySQL`);

    for (const user of users) {
      try {
        // Verificar si ya existe en Prisma
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (existingUser) {
          logger.info(`⚠️ Usuario ${user.email} ya existe en Prisma, saltando...`);
          continue;
        }

        // Crear usuario en Prisma
        const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ').trim();
        const role = user.rol === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE';

        await prisma.user.create({
          data: {
            email: user.email,
            password: user.contrasenia, // Ya está hasheado
            name: fullName || user.nombre,
            role: role,
          }
        });

        logger.info(`✅ Usuario ${user.email} migrado exitosamente`);
      } catch (error) {
        logger.error(`❌ Error migrando usuario ${user.email}:`, error.message);
      }
    }

    logger.info('🎉 Migración de usuarios completada');

  } catch (error) {
    logger.error('💥 Error en migración de usuarios:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await mysqlPool.end();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsers()
    .then(() => {
      logger.info('✅ Usuarios migrados exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Error fatal en migración de usuarios', error);
      process.exit(1);
    });
}

export { migrateUsers };
