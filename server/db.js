/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;
const dbType = process.env.DB_TYPE || 'sqlite';
const dbPath = process.env.DB_PATH || path.join(__dirname, 'dictionary.db');

/**
 * Veritabanı Bağlantısını Başlat
 */
async function initDB() {
    if (dbType === 'mysql') {
        // MySQL Pool Yapılandırması
        db = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_NAME || 'sozluk_db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log("MySQL Bağlantısı Hazır (Pool)");

        // Tabloyu Oluştur (MySQL)
        await db.query(`
            CREATE TABLE IF NOT EXISTS words (
                id INT AUTO_INCREMENT PRIMARY KEY,
                source_word VARCHAR(255) NOT NULL,
                target_word VARCHAR(255) NOT NULL,
                context_hint TEXT,
                user_id INT NOT NULL DEFAULT 1,
                language_pair VARCHAR(50) NOT NULL DEFAULT 'tr-en',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_source (source_word),
                INDEX idx_user_lang (user_id, language_pair)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
    } else {
        // SQLite Fallback (Dev)
        const dbPath = path.resolve(__dirname, 'sozluk.sqlite');
        db = new sqlite3.Database(dbPath);

        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS words (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_word TEXT NOT NULL,
                    target_word TEXT NOT NULL,
                    context_hint TEXT,
                    user_id INTEGER NOT NULL DEFAULT 1,
                    language_pair TEXT NOT NULL DEFAULT 'tr-en',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Verileri taşı (Basit kontrol)
            console.log('SQLite veritabanı hazır.');
        });
    }
}

// MySQL/SQLite uyumlu sorgu yardımcıları
const query = {
    all: async (sql, params = []) => {
        if (dbType === 'mysql') {
            const [rows] = await db.execute(sql, params);
            return rows;
        } else {
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
            });
        }
    },
    run: async (sql, params = []) => {
        if (dbType === 'mysql') {
            const [result] = await db.execute(sql, params);
            return result;
        } else {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
            });
        }
    }
};

module.exports = { initDB, query };
