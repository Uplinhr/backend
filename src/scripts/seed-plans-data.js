import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- PLANES (Single Hire, Pro, Premium, Platinum) ---
  const planes = [
    {
      name: 'Single Hire',
      description: 'Ideal para quienes quieren sumar talento puntual mientras comienzan a armar su equipo.',
      price: 720,
      currency: 'USD',
      isActive: true,
      features: {
        creditos_mes: 120,
        meses_cred: 0,
        horas_cons: 0,
        custom: false,
        // Display features
        creditos: 120,
        vacantes: '1 (junior y unique)',
        proceso: 'Proceso básico de selección',
        soporte: 'Soporte y acompañamiento',
        onboarding: 'Onboarding asistido',
        garantia: 'Garantía de 3 meses',
        vencimiento: 'Sin vencimiento',
        pago: 'Pago único',
        // No discount
        oldPrice: null,
        descuento: null
      }
    },
    {
      name: 'Pro',
      description: 'Ideal para startups o Pymes en fase de crecimiento que necesitan consolidar un equipo sólido.',
      price: 3762,
      currency: 'USD',
      isActive: true,
      features: {
        creditos_mes: 660,
        meses_cred: 0,
        horas_cons: 0,
        custom: false,
        // Display features
        creditos: 660,
        vacantes: 'hasta 5 juniors (combinables según nivel)',
        proceso: 'Proceso básico de selección',
        soporte: 'Soporte y acompañamiento',
        onboarding: 'Onboarding asistido',
        garantia: 'Garantía de 3 meses',
        vencimiento: 'Sin vencimiento',
        pago: 'Pago único',
        // 5% discount
        oldPrice: 3960,
        descuento: '5% OFF'
      }
    },
    {
      name: 'Premium',
      description: 'Ideal para startups en expansión que requieren sumar varios perfiles al mismo tiempo.',
      price: 5346,
      currency: 'USD',
      isActive: true,
      features: {
        creditos_mes: 990,
        meses_cred: 0,
        horas_cons: 0,
        custom: false,
        // Display features
        creditos: 990,
        vacantes: 'hasta 8 juniors (combinables según nivel)',
        proceso: 'Proceso básico de selección',
        soporte: 'Soporte y acompañamiento',
        onboarding: 'Onboarding asistido',
        garantia: 'Garantía de 3 meses',
        vencimiento: 'Sin vencimiento',
        pago: 'Pago único',
        // 10% discount
        oldPrice: 5940,
        descuento: '10% OFF'
      }
    },
    {
      name: 'Platinum',
      description: 'Ideal para scale-ups o empresas en crecimiento continuo con contrataciones constantes.',
      price: 6732,
      currency: 'USD',
      isActive: true,
      features: {
        creditos_mes: 1320,
        meses_cred: 0,
        horas_cons: 0,
        custom: false,
        // Display features
        creditos: 1320,
        vacantes: 'hasta 10 juniors (combinables según nivel)',
        proceso: 'Proceso básico de selección',
        soporte: 'Soporte y acompañamiento',
        onboarding: 'Onboarding asistido',
        garantia: 'Garantía de 3 meses',
        vencimiento: 'Sin vencimiento',
        pago: 'Pago único',
        // 15% discount
        oldPrice: 7920,
        descuento: '15% OFF'
      }
    }
  ];

  console.log('Creating Plans...');
  for (const plan of planes) {
    // Check if exists by name to avoid duplicates or update
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (existing) {
      await prisma.plan.update({ where: { id: existing.id }, data: plan });
    } else {
      await prisma.plan.create({ data: plan });
    }
  }

  // --- MEMBRESÍAS (Start, Growth, Premium, Custom) ---
  const memberships = [
    {
      code: 'START',
      name: 'Start',
      priceMonthly: 149,
      creditsPerMonth: 110,
      benefits: [
        '110 créditos de búsqueda de talento (1 vacante entry level/mes)',
        '2 horas de consultoría mensual',
        '1 mentoría grupal + 1 curso mensual en Uplin Academy',
        'Charlas ilimitadas en Uplin Academy',
        'Soporte por email y WhatsApp',
        'Acceso a comunidad exclusiva Uplin',
        'HR Advisor dedicado'
      ]
    },
    {
      code: 'GROWTH',
      name: 'Growth',
      priceMonthly: 499,
      creditsPerMonth: 120,
      benefits: [
        '120 créditos de búsqueda de talento (1 vacante junior/mes)',
        'Créditos acumulables hasta 3 meses',
        '4 horas de consultoría mensual',
        '1 mentoría grupal + 1 curso mensual en Uplin Academy',
        'Charlas ilimitadas en Uplin Academy',
        'Soporte por email y WhatsApp',
        'Acceso a comunidad exclusiva Uplin',
        'HR Advisor dedicado'
      ]
    },
    {
      code: 'PREMIUM',
      name: 'Premium',
      priceMonthly: 1399,
      creditsPerMonth: 300,
      benefits: [
        '300 créditos de búsqueda de talento (1 vacante C-level/mes o combinación de perfiles)',
        'Créditos acumulables hasta 3 meses',
        '8 horas de consultoría mensual',
        '1 mentoría grupal + 1 curso mensual en Uplin Academy',
        'Charlas ilimitadas en Uplin Academy',
        'Soporte por email y WhatsApp',
        'Acceso a comunidad exclusiva Uplin',
        'HR Advisor dedicado',
        'Auditoría de talento'
      ]
    },
    {
      code: 'CUSTOM',
      name: 'Custom',
      priceMonthly: 0, // A convenir
      creditsPerMonth: 0,
      benefits: [
        'Créditos de búsqueda de talento a medida',
        'Horas de consultoría personalizadas',
        'Membresía a Uplin Academy (1 mentoría grupal mensual + 1 curso mensual + charlas ilimitadas)',
        'Soporte por email y WhatsApp',
        'Acceso a comunidad exclusiva Uplin',
        'HR Advisor dedicado',
        'Auditoría del área de talento'
      ]
    }
  ];

  console.log('Creating Memberships...');
  for (const mem of memberships) {
    await prisma.membershipPlan.upsert({
      where: { code: mem.code },
      update: mem,
      create: mem
    });
  }

  // --- SIMULADOR (TalentSearchService) ---
  // Vacantes
  const vacantes = [
    { name: 'Entry / Principiante', price: 110, category: 'VACANTE', description: '110 créditos / vacante' },
    { name: 'Junior', price: 120, category: 'VACANTE', description: '120 créditos / vacante' },
    { name: 'Semi-Senior', price: 130, category: 'VACANTE', description: '130 créditos / vacante' },
    { name: 'Senior', price: 220, category: 'VACANTE', description: '220 créditos / vacante' },
    { name: 'Director', price: 310, category: 'VACANTE', description: '310 créditos / vacante' },
    { name: 'C Level', price: 595, category: 'VACANTE', description: '595 créditos / vacante' }
  ];

  // Servicios Adicionales
  const adicionales = [
    { name: 'Publicación en 1 portal especializado', price: 20, category: 'ADICIONAL', description: '20 créditos / unidad' },
    { name: 'Pauta en LinkedIn', price: 20, category: 'ADICIONAL', description: '20 créditos / unidad' },
    { name: 'Aplicación de tests psicotécnicos o personalidad', price: 10, category: 'ADICIONAL', description: '10 créditos / unidad' },
    { name: 'Prueba técnica (varios)', price: 10, category: 'ADICIONAL', description: '10 créditos / unidad' },
    { name: 'Entrevista 100% en inglés', price: 20, category: 'ADICIONAL', description: '20 créditos / unidad' },
    { name: 'Garantía 6 meses', price: 20, category: 'ADICIONAL', description: '20 créditos / unidad' }
  ];

  console.log('Creating Simulator Services...');
  for (const v of vacantes) {
    const existing = await prisma.talentSearchService.findFirst({ where: { name: v.name } });
    if (existing) {
      await prisma.talentSearchService.update({ where: { id: existing.id }, data: v });
    } else {
      await prisma.talentSearchService.create({ data: v });
    }
  }

  for (const a of adicionales) {
    const existing = await prisma.talentSearchService.findFirst({ where: { name: a.name } });
    if (existing) {
      await prisma.talentSearchService.update({ where: { id: existing.id }, data: a });
    } else {
      await prisma.talentSearchService.create({ data: a });
    }
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
