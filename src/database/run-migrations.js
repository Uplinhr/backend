import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

const ensureDatabaseExists = async () => {
  // First connect without specifying the database
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true
  });

  try {
    // Create database if it doesn't exist
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Switch to the database
    await conn.query(`USE \`${DB_NAME}\``);
    
    // Create migrations table if it doesn't exist
    await conn.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
  } finally {
    await conn.end();
  }
};

const getExecutedMigrations = async () => {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    const [rows] = await conn.query('SELECT name FROM _migrations');
    return rows.map(row => row.name);
  } finally {
    await conn.end();
  }
};

const logMigration = async (migrationName) => {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    await conn.query('INSERT INTO _migrations (name) VALUES (?)', [migrationName]);
  } finally {
    await conn.end();
  }
};

const runPendingMigrations = async () => {
  let conn;
  try {
    // First ensure the database exists
    await ensureDatabaseExists();
    
    const executedMigrations = await getExecutedMigrations();

    conn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true
    });

    const migrationFiles = fs.readdirSync(path.join(__dirname, 'migrations'))
      .filter(file => file.endsWith('.sql'))
      .sort()
      .filter(file => !executedMigrations.includes(file));

    if (migrationFiles.length === 0) {
      console.log('✅ No hay migraciones pendientes');
      return;
    }

    console.log('🔍 Migraciones pendientes:', migrationFiles);

    for (const file of migrationFiles) {
      try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf8');
        console.log(`🚀 Ejecutando: ${file}`);
        await conn.query(sql);
        await logMigration(file);
        console.log(`✅ ${file} completada`);
      } catch (error) {
        console.error(`❌ Error en ${file}:`, error.message);
        throw error; // Detiene el proceso si falla una migración
      }
    }
  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1); // Exit with error code
  } finally {
    if (conn) await conn.end();
    process.exit(0); // Exit with success code
  }
};

runPendingMigrations();