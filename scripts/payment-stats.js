import pool from '../src/database/connection.js';

/**
 * Script para ver estadísticas de pagos
 * Ejecutar: node scripts/payment-stats.js
 */

async function getPaymentStats() {
  try {
    console.log('\n📊 Estadísticas de Pagos\n');
    console.log('='.repeat(80));
    
    // Estadísticas generales
    const [general] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount END), 0) as revenue,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount END), 0) as avg_order
      FROM payment_orders
    `);
    
    console.log('\n📈 Resumen General:');
    console.table(general);
    
    // Por pasarela
    const [byGateway] = await pool.query(`
      SELECT 
        payment_gateway,
        COUNT(*) as orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount END), 0) as revenue
      FROM payment_orders
      GROUP BY payment_gateway
    `);
    
    console.log('\n💳 Por Pasarela de Pago:');
    console.table(byGateway);
    
    // Por mes
    const [byMonth] = await pool.query(`
      SELECT 
        DATE_FORMAT(fecha_alta, '%Y-%m') as month,
        COUNT(*) as orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount END), 0) as revenue
      FROM payment_orders
      WHERE fecha_alta >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(fecha_alta, '%Y-%m')
      ORDER BY month DESC
    `);
    
    console.log('\n📅 Últimos 6 Meses:');
    console.table(byMonth);
    
    // Top clientes
    const [topCustomers] = await pool.query(`
      SELECT 
        u.nombre,
        u.apellido,
        u.email,
        COUNT(*) as orders,
        COALESCE(SUM(po.total_amount), 0) as total_spent
      FROM payment_orders po
      JOIN usuarios u ON po.id_usuario = u.id
      WHERE po.status = 'completed'
      GROUP BY po.id_usuario
      ORDER BY total_spent DESC
      LIMIT 10
    `);
    
    console.log('\n👑 Top 10 Clientes:');
    console.table(topCustomers);
    
    // Órdenes recientes
    const [recent] = await pool.query(`
      SELECT 
        order_number,
        payment_gateway,
        total_amount,
        currency,
        status,
        fecha_alta
      FROM payment_orders
      ORDER BY fecha_alta DESC
      LIMIT 10
    `);
    
    console.log('\n🕐 Últimas 10 Órdenes:');
    console.table(recent);
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getPaymentStats();
