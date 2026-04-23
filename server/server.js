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

// Tüm kelimeleri getir (Polysemy destekli)
app.get('/api/words', async (req, res) => {
    try {
        const rows = await query.all('SELECT source_word, target_word, context_hint FROM words ORDER BY source_word ASC');
        const dictionary = {};
        rows.forEach(row => {
            const word = row.source_word;
            if (!dictionary[word]) dictionary[word] = [];
            dictionary[word].push({ translation: row.target_word, hint: row.context_hint });
        });
        res.json(dictionary);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Yeni kelime ekle veya güncelle
app.post('/api/words', async (req, res) => {
    const { word, translation, hint } = req.body;
    if (!word || !translation) return res.status(400).json({ error: "Eksik veri" });

    try {
        await query.run('INSERT INTO words (source_word, target_word, context_hint) VALUES (?, ?, ?)',
            [word.toLowerCase(), translation, hint]);
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

// Veritabanını başlat ve server'ı ayağa kaldır
initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`LexiFlow API running on port ${PORT}`);
    });
}).catch(err => {
    console.error("DB Başlatma Hatası:", err);
    process.exit(1);
});
