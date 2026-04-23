/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, query } = require('./db');
const SmartSuggestHandler = require('./SmartSuggestHandler');
const NLPService = require('./NLPService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' })); // Toplu veri için limit artırıldı

// Statik dosyaları servis et
app.use(express.static(path.join(__dirname, '../client')));

// Ana sayfa rotası
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// --- API ENDPOINTS ---

// Kelimeleri getir (Dil çiftine göre filtrele)
app.get('/api/words', async (req, res) => {
    try {
        const { src, target } = req.query;
        let sql = "SELECT * FROM words WHERE 1=1";
        const params = [];
        if (src) { sql += " AND source_lang = ?"; params.push(src); }
        if (target) { sql += " AND target_lang = ?"; params.push(target); }

        const rows = await query.all(sql, params);
        // N-Gram motoru için grup yapısı korundu
        const dictionary = {};
        rows.forEach(row => {
            const key = row.source_word.toLowerCase();
            if (!dictionary[key]) dictionary[key] = [];
            dictionary[key].push({
                target_word: row.target_word,
                hint: row.context_hint,
                src_lang: row.source_lang,
                target_lang: row.target_lang
            });
        });
        res.json(dictionary);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Kelime ekle/güncelle
app.post('/api/words', async (req, res) => {
    try {
        const { source_word, target_word, context_hint, source_lang = 'en', target_lang = 'tr' } = req.body;
        await query.run(
            "INSERT INTO words (source_word, target_word, context_hint, source_lang, target_lang) VALUES (?, ?, ?, ?, ?)",
            [source_word.toLowerCase(), target_word, context_hint, source_lang, target_lang]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Kelime sil
app.delete('/api/words/:word', async (req, res) => {
    try {
        await query.run('DELETE FROM words WHERE source_word = ?', [req.params.word.toLowerCase()]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * AI Tabanlı Modüler Smart-Suggest
 */
app.get('/api/suggest', async (req, res) => {
    const q = SmartSuggestHandler.Receiver.normalize(req.query.q);
    if (!q) return res.json({ suggestions: [] });
    try {
        const matches = await SmartSuggestHandler.Engine.getMatches({ all: query.all }, q);
        res.json(SmartSuggestHandler.Sender.package(matches));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * Türkçe NLP Analiz (Stemming)
 */
app.post('/api/analyze-nlp', (req, res) => {
    const { word } = req.body;
    if (!word) return res.status(400).json({ error: "Kelime gerekli." });
    res.json(NLPService.analyze(word));
});

/**
 * Gelişmiş Toplu İçe Aktar (Polysemy Uyumlu)
 */
app.post('/api/import', async (req, res) => {
    const { data, strategy } = req.body;
    if (!data) return res.status(400).json({ error: "Veri yok" });

    try {
        let success = 0, updated = 0, skipped = 0;
        const words = Object.keys(data);

        for (const word of words) {
            const translations = Array.isArray(data[word]) ? data[word] : [{ translation: data[word] }];

            for (const entry of translations) {
                const existing = await query.all('SELECT * FROM words WHERE source_word = ? AND target_word = ?',
                    [word.toLowerCase(), entry.translation]);

                if (existing.length > 0) {
                    if (strategy === 'replace') {
                        await query.run('DELETE FROM words WHERE source_word = ?', [word.toLowerCase()]);
                        await query.run('INSERT INTO words (source_word, target_word, context_hint) VALUES (?, ?, ?)',
                            [word.toLowerCase(), entry.translation, entry.hint]);
                        updated++;
                    } else if (strategy === 'update') {
                        await query.run('UPDATE words SET context_hint = ? WHERE id = ?', [entry.hint, existing[0].id]);
                        updated++;
                    } else { skipped++; }
                } else {
                    await query.run('INSERT INTO words (source_word, target_word, context_hint) VALUES (?, ?, ?)',
                        [word.toLowerCase(), entry.translation, entry.hint]);
                    success++;
                }
            }
        }
        res.json({ success: true, report: { success, updated, skipped } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// HARİCİ VERİ MADENCİLİĞİ (Evolution v2.0)
const ImportService = require('./ImportService');
app.post('/api/import/external', async (req, res) => {
    try {
        const { url, type, source_lang, target_lang } = req.body;
        const rawPairs = await ImportService.fetchFromUrl(url, type);
        const processed = ImportService.preprocess(rawPairs, source_lang, target_lang);

        let successCount = 0;
        for (const item of processed) {
            try {
                await query.run(
                    "INSERT INTO words (source_word, target_word, context_hint, source_lang, target_lang) VALUES (?, ?, ?, ?, ?)",
                    [item.source.toLowerCase(), item.target, item.hint, item.source_lang, item.target_lang]
                );
                successCount++;
            } catch (e) { /* Çakışma veya hata durumunda atla */ }
        }

        res.json({ success: true, count: successCount });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Veritabanını başlat ve server'ı ayağa kaldır
initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`LexiFlow API running on port ${PORT}`);
    });
}).catch(err => {
    console.error("DB Başlatma Hatası:", err);
    process.exit(1);
});
