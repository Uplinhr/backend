import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

// Test script to understand the error
async function testPlanEdit() {
  try {
    // First, get a plan
    const plan = await prisma.plan.findFirst({
      where: { name: 'Single Hire' }
    });
    
    console.log('Found plan:', JSON.stringify(plan, null, 2));
    
    if (!plan) {
      console.log('No plan found!');
      return;
    }
    
    // Try to update it with typical frontend payload
    const testPayload = {
      nombre: 'Single Hire',
      creditos_mes: 120,
      meses_cred: 0,
      horas_cons: 0,
      precio: '720',
      active: true,
      custom: false,
      features: plan.features
    };
    
    console.log('\nTrying to update with payload:', JSON.stringify(testPayload, null, 2));
    
    // Simulate what model.editById does NOW (with fix)
    const data = {};
    if (testPayload.nombre !== undefined) data.name = testPayload.nombre;
    if (testPayload.precio !== undefined) data.price = parseFloat(testPayload.precio); // FIXED!
    if (testPayload.active !== undefined) data.isActive = !!testPayload.active;
    
    const featureUpdates = {};
    if (testPayload.creditos_mes !== undefined) featureUpdates.creditos_mes = testPayload.creditos_mes;
    if (testPayload.meses_cred !== undefined) featureUpdates.meses_cred = testPayload.meses_cred;
    if (testPayload.horas_cons !== undefined) featureUpdates.horas_cons = testPayload.horas_cons;
    if (testPayload.custom !== undefined) featureUpdates.custom = testPayload.custom;
    
    if (Object.keys(featureUpdates).length > 0) {
      const current = await prisma.plan.findUnique({ where: { id: plan.id }, select: { features: true } });
      data.features = { ...(current?.features || {}), ...featureUpdates };
    }
    
    console.log('\nData to update:', JSON.stringify(data, null, 2));
    
    if (Object.keys(data).length === 0) {
      console.log('ERROR: No data to update!');
      return;
    }
    
    // Try the update
    const result = await prisma.plan.update({ where: { id: plan.id }, data });
    console.log('\nUpdate successful!', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPlanEdit();
