import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

const initDatabase = async () => {
    let rootConnection, dbConnection;

    try{
        const rootConnection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD
        });

        await rootConnection.query(`
            CREATE DATABASE IF NOT EXISTS ${DB_NAME}
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        
        // Ejecuta todas las migraciones
        const dbConnection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
            multipleStatements: true  // Permite ejecutar múltiples queries
        });
        const migrationsPath = path.join(__dirname, 'migrations');
        const migrations = fs.readdirSync(migrationsPath)
            .filter(file => file.endsWith('.sql'))  // solo archivos .sql
            .sort();                                // Ejecuta en orden
        for (const file of migrations) {
            const filePath = path.join(migrationsPath, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            console.log(`🔄 Ejecutando migración: ${file}`);
            await dbConnection.query(sql);
        }

        console.log('✅ Base de datos y tablas creadas exitosamente');
    } catch (error){
        console.error('❌ Error al inicializar DB:', error)
    } finally {
        if (rootConnection) await rootConnection.end();
        if (dbConnection) await dbConnection.end();
        process.exit();
    }
}

initDatabase();