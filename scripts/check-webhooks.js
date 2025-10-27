import pool from '../src/database/database.js';

/**
 * Script para revisar webhooks pendientes
 * Ejecutar: node scripts/check-webhooks.js
 */

async function checkWebhooks() {
  try {
    console.log('\n🔍 Revisando webhooks pendientes...\n');
    
    // Webhooks no procesados
    const [pending] = await pool.query(`
      SELECT payment_gateway, event_type, COUNT(*) as count 
      FROM webhook_events 
      WHERE processed = FALSE 
      GROUP BY payment_gateway, event_type
    `);
    
    console.log('📋 Webhooks Pendientes:');
    console.table(pending);
    
    // Webhooks con errores
    const [errors] = await pool.query(`
      SELECT payment_gateway, event_type, processing_error, COUNT(*) as count 
      FROM webhook_events 
      WHERE processing_status = 'failed' 
      AND fecha_alta > NOW() - INTERVAL 24 HOUR
      GROUP BY payment_gateway, event_type, processing_error
    `);
    
    if (errors.length > 0) {
      console.log('\n❌ Webhooks con Errores (últimas 24h):');
      console.table(errors);
    } else {
      console.log('\n✅ No hay webhooks con errores en las últimas 24 horas');
    }
    
    // Webhooks recientes exitosos
    const [recent] = await pool.query(`
      SELECT payment_gateway, event_type, fecha_alta 
      FROM webhook_events 
      WHERE processed = TRUE 
      ORDER BY fecha_alta DESC 
      LIMIT 5
    `);
    
    console.log('\n✅ Últimos Webhooks Procesados:');
    console.table(recent);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkWebhooks();
