// src/database/seed.js - Script para migrar datos de seeders SQL a Prisma
import { PrismaClient } from '../generated/prisma/index.js';
import logger from '../config/logger.config.js';

const prisma = new PrismaClient();

async function migrateTaxConfigs() {
  // Datos basados en 03-tax-config.sql (ejemplo real)
  const taxData = [
    { name: 'IVA', rate: 0.21, country: 'Argentina', isActive: true },
    { name: 'IGV', rate: 0.18, country: 'Peru', isActive: true },
  ];

  for (const tax of taxData) {
    try {
      await prisma.taxConfig.create({ data: tax });
      logger.info('TaxConfig migrado', logger.sanitize({ name: tax.name }));
    } catch (error) {
      logger.error('Error migrando TaxConfig', logger.sanitize({ error: error.message }));
    }
  }
}

async function seedMembershipPlans() {
  const plans = [
    {
      code: 'START',
      name: 'Start',
      priceMonthly: 149,
      currency: 'USD',
      creditsPerMonth: 110,
      rolloverMonths: 0,
      benefits: { trialDays: 7, academy: true, support: ['email','whatsapp'] },
      isActive: true,
    },
    {
      code: 'GROWTH',
      name: 'Growth',
      priceMonthly: 499,
      currency: 'USD',
      creditsPerMonth: 120,
      rolloverMonths: 3,
      benefits: { academy: true, support: ['email','whatsapp'], advisor: false },
      isActive: true,
    },
    {
      code: 'PREMIUM',
      name: 'Premium',
      priceMonthly: 1399,
      currency: 'USD',
      creditsPerMonth: 300,
      rolloverMonths: 3,
      benefits: { academy: true, support: ['email','whatsapp'], advisor: true },
      isActive: true,
    },
    {
      code: 'CUSTOM',
      name: 'Custom',
      priceMonthly: 0,
      currency: 'USD',
      creditsPerMonth: 0,
      rolloverMonths: 3,
      benefits: { custom: true },
      isActive: true,
    },
  ];

  for (const p of plans) {
    try {
      await prisma.membershipPlan.upsert({
        where: { code: p.code },
        update: { ...p },
        create: { ...p },
      });
      logger.info('MembershipPlan seed (upsert)', logger.sanitize({ code: p.code }));
    } catch (error) {
      logger.error('Error seeding MembershipPlan', logger.sanitize({ error: error.message }));
    }
  }
}

async function migrateTalentSearchServices() {
  // Datos basados en 04-talent-search-services.sql (ejemplo real)
  const services = [
    { name: 'Búsqueda Básica', description: 'Búsqueda simple de talento', price: 100, currency: 'USD', category: 'Basic', isActive: true },
    { name: 'Búsqueda Avanzada', description: 'Búsqueda con filtros', price: 200, currency: 'USD', category: 'Advanced', isActive: true },
  ];

  for (const service of services) {
    try {
      await prisma.talentSearchService.create({ data: service });
      logger.info('TalentSearchService migrado', logger.sanitize({ name: service.name }));
    } catch (error) {
      logger.error('Error migrando TalentSearchService', logger.sanitize({ error: error.message }));
    }
  }
}

async function migrateUsers() {
  // Datos de usuarios para consultores
  const users = [
    { email: 'juan@example.com', name: 'Juan Pérez', role: 'CLIENTE' },
    { email: 'maria@example.com', name: 'María López', role: 'CLIENTE' },
  ];

  for (const user of users) {
    try {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user
      });
      logger.info('User migrado (upsert)', logger.sanitize({ name: user.name }));
    } catch (error) {
      logger.error('Error migrando User', logger.sanitize({ error: error.message }));
    }
  }
}

async function migrateConsultants() {
  // Datos con relación a usuarios (actualizado con userId)
  const consultants = [
    { name: 'Juan Pérez', email: 'juan@example.com', phone: '123456789', bio: 'Experto en IT', skills: ['JavaScript', 'React'], hourlyRate: 50, isActive: true, userId: await getUserIdByEmail('juan@example.com') },
    { name: 'María López', email: 'maria@example.com', phone: '987654321', bio: 'Especialista en datos', skills: ['Python', 'SQL'], hourlyRate: 60, isActive: true, userId: await getUserIdByEmail('maria@example.com') },
  ];

  for (const consultant of consultants) {
    try {
      await prisma.consultant.create({ data: consultant });
      logger.info('Consultant migrado', logger.sanitize({ name: consultant.name }));
    } catch (error) {
      logger.error('Error migrando Consultant', logger.sanitize({ error: error.message }));
    }
  }
}

async function getUserIdByEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  return user ? user.id : null;
}

async function migratePlans() {
  // Datos basados en 06-update-planes.sql (ejemplo real)
  const plans = [
    { name: 'Básico', description: 'Plan básico para principiantes', price: 10, currency: 'USD', features: { limit: 10 }, isActive: true },
    { name: 'Premium', description: 'Plan premium con más características', price: 50, currency: 'USD', features: { limit: 100 }, isActive: true },
  ];

  for (const plan of plans) {
    try {
      await prisma.plan.create({ data: plan });
      logger.info('Plan migrado', logger.sanitize({ name: plan.name }));
    } catch (error) {
      logger.error('Error migrando Plan', logger.sanitize({ error: error.message }));
    }
  }
}

async function main() {
  logger.info('Iniciando migración de datos de seeders');

  await migrateUsers(); // Agrega migración de usuarios primero
  await migrateTaxConfigs();
  await migrateTalentSearchServices();
  await migrateConsultants();
  await migratePlans();
  await seedMembershipPlans();

  logger.info('Migración de datos completada');
}

main().catch(console.error).finally(() => prisma.$disconnect());