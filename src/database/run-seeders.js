import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
const SEEDS_DIR = path.join(__dirname, 'seeders');
const EXECUTED_SEEDS_FILE = path.join(__dirname, 'seeders', 'executed.json');

// Crear archivo de registro si no existe
if (!fs.existsSync(EXECUTED_SEEDS_FILE)) {
  fs.writeFileSync(EXECUTED_SEEDS_FILE, '[]');
}

const getExecutedSeeds = () => {
  return JSON.parse(fs.readFileSync(EXECUTED_SEEDS_FILE, 'utf8'));
};

const logSeed = (seedName) => {
  const executedSeeds = getExecutedSeeds();
  executedSeeds.push(seedName);
  fs.writeFileSync(EXECUTED_SEEDS_FILE, JSON.stringify(executedSeeds, null, 2));
};

const runSeeds = async () => {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      multipleStatements: true
    });

    const executedSeeds = getExecutedSeeds();
    const seedFiles = fs.readdirSync(SEEDS_DIR)
      .filter(file => file.endsWith('.sql') || file.endsWith('.js'))
      .sort()
      .filter(file => !executedSeeds.includes(file));

    if (seedFiles.length === 0) {
      console.log('✅ No hay seeds pendientes');
      return;
    }

    console.log('🌱 Seeds pendientes:', seedFiles);

    for (const file of seedFiles) {
      try {
        console.log(`🚀 Ejecutando: ${file}`);
        
        if (file.endsWith('.sql')) {
          const sql = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf8');
          await conn.query(sql);
        } else if (file.endsWith('.js')) {
          const seedModule = await import(path.join(SEEDS_DIR, file));
          await seedModule.run(conn); // Asume que el módulo exporta una función run
        }
        
        logSeed(file);
        console.log(`✅ ${file} completado`);
      } catch (error) {
        console.error(`❌ Error en ${file}:`, error.message);
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
};

// Ejecutar seeds si se llama directamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds();
}

export { runSeeds };