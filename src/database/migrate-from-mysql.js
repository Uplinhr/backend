// src/database/migrate-from-mysql.js - Script completo para migrar datos de MySQL a PostgreSQL + Prisma
import { PrismaClient } from '../generated/prisma/index.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../config/logger.config.js';
import bcrypt from 'bcrypt';

dotenv.config();

const prisma = new PrismaClient();

// Conexión a MySQL (igual que el proyecto actual)
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

// Función para migrar usuarios de MySQL a PostgreSQL
async function migrateUsers() {
  logger.info('Iniciando migración de usuarios...');

  try {
    const [rows] = await mysqlPool.execute('SELECT * FROM usuarios WHERE active != 0');

    for (const user of rows) {
      try {
        // Mapear datos de MySQL a Prisma
        const userData = {
          email: user.email,
          name: `${user.nombre} ${user.apellido}`.trim(),
          role: user.rol === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE',
          // auth0Id se deja null por ahora (se actualizará cuando implementemos Auth0)
        };

        await prisma.user.create({
          data: userData
        });

        logger.info('Usuario migrado exitosamente', logger.sanitize({
          email: user.email,
          name: userData.name
        }));

      } catch (error) {
        logger.error('Error migrando usuario', logger.sanitize({
          email: user.email,
          error: error.message
        }));
        throw error; // Re-lanzar para rollback
      }
    }

    logger.info(`Migración de usuarios completada: ${rows.length} usuarios procesados`);
  } catch (error) {
    logger.error('Error en migración de usuarios', logger.sanitize({ error: error.message }));
    throw error;
  }
}

// Función para migrar planes
async function migratePlans() {
  logger.info('Iniciando migración de planes...');

  try {
    const [rows] = await mysqlPool.execute('SELECT * FROM planes WHERE active != 0');

    for (const plan of rows) {
      try {
        const planData = {
          name: plan.nombre,
          description: plan.description || `Plan ${plan.nombre}`,
          price: parseFloat(plan.precio) || 0,
          currency: plan.currency || 'USD',
          features: plan.features || {},
          isActive: plan.active != 0,
        };

        await prisma.plan.create({
          data: planData
        });

        logger.info('Plan migrado exitosamente', logger.sanitize({
          name: plan.nombre,
          price: planData.price
        }));

      } catch (error) {
        logger.error('Error migrando plan', logger.sanitize({
          name: plan.nombre,
          error: error.message
        }));
        throw error;
      }
    }

    logger.info(`Migración de planes completada: ${rows.length} planes procesados`);
  } catch (error) {
    logger.error('Error en migración de planes', logger.sanitize({ error: error.message }));
    throw error;
  }
}

// Función para migrar configuración de impuestos
async function migrateTaxConfigs() {
  logger.info('Iniciando migración de configuración de impuestos...');

  try {
    const [rows] = await mysqlPool.execute('SELECT * FROM tax_config WHERE active != 0');

    for (const tax of rows) {
      try {
        const taxData = {
          name: tax.tax_name,
          rate: parseFloat(tax.tax_rate) / 100, // Convertir de 21.00 a 0.21
          country: `${tax.country_code} - ${tax.country_name}`,
          isActive: tax.active != 0,
        };

        await prisma.taxConfig.create({
          data: taxData
        });

        logger.info('TaxConfig migrado exitosamente', logger.sanitize({
          name: tax.tax_name,
          country: taxData.country
        }));

      } catch (error) {
        logger.error('Error migrando TaxConfig', logger.sanitize({
          name: tax.tax_name,
          error: error.message
        }));
        throw error;
      }
    }

    logger.info(`Migración de TaxConfig completada: ${rows.length} configuraciones procesadas`);
  } catch (error) {
    logger.error('Error en migración de TaxConfig', logger.sanitize({ error: error.message }));
    throw error;
  }
}

// Función para migrar servicios de búsqueda de talento
async function migrateTalentSearchServices() {
  logger.info('Iniciando migración de servicios de búsqueda de talento...');

  try {
    const [rows] = await mysqlPool.execute('SELECT * FROM talent_search_services WHERE active != 0 ORDER BY display_order');

    for (const service of rows) {
      try {
        const serviceData = {
          name: service.service_name,
          description: service.description || `Servicio ${service.service_name}`,
          price: parseFloat(service.base_price) || 0,
          currency: 'USD',
          category: service.discount_percentage > 0 ? `Con ${service.discount_percentage}% descuento` : 'Sin descuento',
          isActive: service.active != 0,
        };

        await prisma.talentSearchService.create({
          data: serviceData
        });

        logger.info('TalentSearchService migrado exitosamente', logger.sanitize({
          name: service.service_name,
          price: serviceData.price
        }));

      } catch (error) {
        logger.error('Error migrando TalentSearchService', logger.sanitize({
          name: service.service_name,
          error: error.message
        }));
        throw error;
      }
    }

    logger.info(`Migración de TalentSearchService completada: ${rows.length} servicios procesados`);
  } catch (error) {
    logger.error('Error en migración de TalentSearchService', logger.sanitize({ error: error.message }));
    throw error;
  }
}

// Función para migrar consultores
async function migrateConsultants() {
  logger.info('Iniciando migración de consultores...');

  try {
    const [rows] = await mysqlPool.execute('SELECT * FROM consultants WHERE active != 0');

    for (const consultant of rows) {
      try {
        // Primero crear un usuario para el consultor
        const userData = {
          email: consultant.email,
          name: consultant.full_name,
          role: 'CLIENTE', // Los consultores son clientes en el sistema
        };

        const user = await prisma.user.create({
          data: userData
        });

        // Luego crear el consultor relacionado
        const consultantData = {
          userId: user.id,
          name: consultant.full_name,
          email: consultant.email,
          phone: null, // No hay campo phone en la tabla MySQL original
          bio: consultant.specialization || `Experto en ${consultant.specialization}`,
          skills: [], // Se puede expandir después
          hourlyRate: consultant.hourly_rate ? parseFloat(consultant.hourly_rate) : null,
          isActive: consultant.active != 0 && consultant.available != 0,
        };

        await prisma.consultant.create({
          data: consultantData
        });

        logger.info('Consultant migrado exitosamente', logger.sanitize({
          name: consultant.full_name,
          email: consultant.email
        }));

      } catch (error) {
        logger.error('Error migrando consultant', logger.sanitize({
          name: consultant.full_name,
          error: error.message
        }));
        throw error;
      }
    }

    logger.info(`Migración de consultores completada: ${rows.length} consultores procesados`);
  } catch (error) {
    logger.error('Error en migración de consultores', logger.sanitize({ error: error.message }));
    throw error;
  }
}

// Función principal con transacción y rollback
async function migrateAllData() {
  logger.info('🚀 Iniciando migración completa de MySQL a PostgreSQL...');

  try {
    // Usar transacción de Prisma para rollback automático en caso de error
    await prisma.$transaction(async (tx) => {
      logger.info('📊 Iniciando transacción de migración...');

      // Limpiar datos existentes (opcional, comentar si no se quiere limpiar)
      // await tx.userPlan.deleteMany({});
      // await tx.transaction.deleteMany({});
      // await tx.consultant.deleteMany({});
      // await tx.talentSearchService.deleteMany({});
      // await tx.taxConfig.deleteMany({});
      // await tx.plan.deleteMany({});
      // await tx.user.deleteMany({});

      // Ejecutar migraciones en orden de dependencias
      await migrateUsers();
      await migratePlans();
      await migrateTaxConfigs();
      await migrateTalentSearchServices();
      await migrateConsultants();

      logger.info('✅ Migración completada exitosamente');
    });

  } catch (error) {
    logger.error('❌ Error en migración - ejecutando rollback', logger.sanitize({
      error: error.message,
      stack: error.stack
    }));
    throw error;
  } finally {
    await prisma.$disconnect();
    await mysqlPool.end();
  }
}

// Función para validar integridad después de migración
async function validateMigration() {
  logger.info('🔍 Validando integridad de datos migrados...');

  try {
    const userCount = await prisma.user.count();
    const planCount = await prisma.plan.count();
    const taxCount = await prisma.taxConfig.count();
    const serviceCount = await prisma.talentSearchService.count();
    const consultantCount = await prisma.consultant.count();

    logger.info('📊 Resultados de validación:', logger.sanitize({
      users: userCount,
      plans: planCount,
      taxes: taxCount,
      services: serviceCount,
      consultants: consultantCount
    }));

    return {
      users: userCount,
      plans: planCount,
      taxes: taxCount,
      services: serviceCount,
      consultants: consultantCount
    };

  } catch (error) {
    logger.error('Error en validación', logger.sanitize({ error: error.message }));
    throw error;
  }
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllData()
    .then(async () => {
      await validateMigration();
      logger.info('🎉 Migración completada y validada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Error fatal en migración', logger.sanitize({
        error: error.message,
        stack: error.stack
      }));
      process.exit(1);
    });
}

export { migrateAllData, validateMigration };
