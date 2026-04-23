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

// HARİCİ VERİ MADENCİLİĞİ (Evolution v2.0 - Scraper 2.0)
const ScraperService = require('./ScraperService');
app.post('/api/import/external', async (req, res) => {
    try {
        const { url, type, source_lang, target_lang } = req.body;
        const rawPairs = await ScraperService.fetchFromUrl(url, type);
        const processed = ScraperService.preprocess(rawPairs, source_lang, target_lang);

        let successCount = 0;
        for (const item of processed) {
            try {
                await query.run(
                    "INSERT OR IGNORE INTO words (source_word, target_word, context_hint, source_lang, target_lang) VALUES (?, ?, ?, ?, ?)",
                    [item.source.toLowerCase(), item.target, item.hint, item.source_lang, item.target_lang]
                );
                successCount++;
            } catch (e) { /* Çakışma durumunda atlanır */ }
        }

        res.json({ success: true, count: successCount });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Alias for import-web as requested
app.post('/api/import-web', (req, res) => app._router.handle({ method: 'POST', url: '/api/import/external', body: req.body }, res));

// OTOMATİK VERİ ÇEKİMİ (LexiFlow 3.0)
const AutoIngestionService = require('./AutoIngestionService');
app.post('/api/auto-ingest', async (req, res) => {
    try {
        const { source_id, limit, language_pair } = req.body;
        const result = await AutoIngestionService.ingest(source_id, limit, language_pair);
        res.json({ success: true, report: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BELGE İNDİRME (Export Center)
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

app.get('/api/export/:format', async (req, res) => {
    try {
        const { format } = req.params;
        const { lang_pair, sort, scope } = req.query;

        // Veri Çekme ve Filtreleme
        let sql = "SELECT source_word, target_word, context_hint, source_lang, target_lang FROM words";
        const params = [];

        if (lang_pair && lang_pair !== 'all') {
            const [src, target] = lang_pair.split('-');
            sql += " WHERE source_lang = ? AND target_lang = ?";
            params.push(src, target);
        }

        if (sort === 'a-z') sql += " ORDER BY source_word ASC";
        else if (sort === 'z-a') sql += " ORDER BY source_word DESC";
        else sql += " ORDER BY created_at DESC";

        const words = await query.all(sql, params);

        if (format === 'csv') {
            let csv = "Source;Target;Hint;Langs\n";
            words.forEach(w => {
                csv += `"${w.source_word}";"${w.target_word}";"${w.context_hint || ''}";"${w.source_lang}-${w.target_lang}"\n`;
            });
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=lexiflow_export.csv');
            return res.send(csv);
        }

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('LexiFlow Words');
            sheet.columns = [
                { header: 'Source Word', key: 'src', width: 20 },
                { header: 'Translation', key: 'target', width: 25 },
                { header: 'Hint', key: 'hint', width: 30 },
                { header: 'Lang Pair', key: 'lang', width: 15 }
            ];
            words.forEach(w => sheet.addRow({ src: w.source_word, target: w.target_word, hint: w.context_hint, lang: `${w.source_lang}-${w.target_lang}` }));

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=lexiflow_export.xlsx');
            return await workbook.xlsx.write(res);
        }

        if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=lexiflow_export.pdf');
            doc.pipe(res);

            // Başlık
            doc.fontSize(20).text('LexiFlow Sözlük Raporu', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Tarih: ${new Date().toLocaleDateString()} | Toplam Kelime: ${words.length}`, { align: 'right' });
            doc.moveDown();

            // Tablo (Basit Çizim)
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('Kelime', 50, doc.y, { width: 150 });
            doc.text('Çeviri', 200, doc.y, { width: 150 });
            doc.text('Dili', 350, doc.y);
            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            doc.font('Helvetica').fontSize(10);
            words.forEach(w => {
                const currentY = doc.y;
                if (currentY > 700) doc.addPage();
                doc.text(w.source_word, 50, doc.y, { width: 150 });
                doc.text(w.target_word, 200, currentY, { width: 150 });
                doc.text(`${w.source_lang}-${w.target_lang}`, 350, currentY);
                doc.moveDown(0.8);
            });

            return doc.end();
        }

        res.status(400).send("Geçersiz format");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
