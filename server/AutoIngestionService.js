/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */

const axios = require('axios');
const csv = require('csv-parser');
const stream = require('stream');
const { query } = require('./db');

const AutoIngestionService = {
    // Kaynak Tanımları (Konfigürasyon)
    sources: {
        'en-tr-basic': {
            url: 'https://raw.githubusercontent.com/adambard/learn-turkish/master/data/en-tr.json',
            type: 'JSON',
            pair: 'en-tr',
            mapping: null // Doğrudan {word: trans} formatı
        },
        'en-tr-common': {
            url: 'https://example.com/vocab.csv',
            type: 'CSV',
            pair: 'en-tr',
            mapping: { source: 'word', target: 'meaning' }
        }
    },

    /**
     * Otomatik İçe Aktarımı Başlat
     */
    async ingest(sourceId, limit = 1000, languagePair = 'en-tr') {
        const sourceCfg = this.sources[sourceId];
        if (!sourceCfg) throw new Error("Kaynak bulunamadı: " + sourceId);

        console.log(`[AutoIngest] Başlatılıyor: ${sourceId} (${sourceCfg.type})`);

        try {
            const response = await axios.get(sourceCfg.url, { timeout: 15000 });
            let pairs = [];

            if (sourceCfg.type === 'JSON') {
                pairs = this.parseJSON(response.data, sourceCfg);
            } else if (sourceCfg.type === 'CSV') {
                pairs = await this.parseCSV(response.data, sourceCfg);
            }

            // Filtreleme, Sınırlama ve Sanitizasyon
            const sanitized = this.sanitize(pairs, limit, languagePair);

            // Veritabanına Toplu Ekleme
            const result = await this.bulkInsert(sanitized);

            console.log(`[AutoIngest] Tamamlandı: ${result.success} başarılı, ${result.skipped} atlanan (Duplicate).`);
            return result;
        } catch (err) {
            console.error(`[AutoIngest] Hata [${sourceId}]:`, err.message);
            throw err;
        }
    },

    parseJSON(data, cfg) {
        if (typeof data === 'string') data = JSON.parse(data);

        // Format Tespiti (Derin Arama)
        if (Array.isArray(data)) {
            return data.map(item => ({
                src: item.source_word || item.word || item.src || item.en || item[0],
                target: item.target_word || item.translation || item.target || item.tr || item[1]
            }));
        }

        // { "apple": "elma" } formatı
        return Object.entries(data).map(([k, v]) => ({ src: k, target: v }));
    },

    async parseCSV(data, cfg) {
        return new Promise((resolve, reject) => {
            const results = [];
            const s = new stream.Readable();
            s.push(data);
            s.push(null);

            s.pipe(csv())
                .on('data', (row) => {
                    const src = cfg.mapping ? row[cfg.mapping.source] : (row.word || row.source);
                    const target = cfg.mapping ? row[cfg.mapping.target] : (row.translation || row.target);
                    if (src && target) results.push({ src, target });
                })
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    },

    sanitize(pairs, limit, languagePair) {
        const [srcLang, targetLang] = languagePair.split('-');
        const sanitized = [];

        for (const p of pairs) {
            if (sanitized.length >= limit) break;

            let s = String(p.src || '').trim();
            let t = String(p.target || '').trim();

            // Karakter Kontrolü & Boş Kayıt Filtreleme
            if (!s || !t || s.length < 1 || t.length < 1) continue;
            if (s.includes('http') || s.length > 100) continue; // Şüpheli verileri ele

            sanitized.push({
                source_word: s.toLowerCase(),
                target_word: t,
                source_lang: srcLang || 'en',
                target_lang: targetLang || 'tr',
                hint: 'Auto-Ingested'
            });
        }
        return sanitized;
    },

    async bulkInsert(items) {
        let success = 0;
        let skipped = 0;

        for (const item of items) {
            try {
                // db.js'deki query nesnesini kullan
                await query.run(
                    "INSERT OR IGNORE INTO words (source_word, target_word, context_hint, source_lang, target_lang) VALUES (?, ?, ?, ?, ?)",
                    [item.source_word, item.target_word, item.hint, item.source_lang, item.target_lang]
                );
                success++;
            } catch (e) {
                skipped++;
            }
        }
        return { success, skipped };
    }
};

module.exports = AutoIngestionService;
