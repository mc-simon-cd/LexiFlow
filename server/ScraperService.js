/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */

const axios = require('axios');

const ScraperService = {
    /**
     * Harici URL'den veri çek ve parse et
     */
    async fetchFromUrl(url, type = 'json') {
        try {
            const response = await axios.get(url, { timeout: 10000 });
            const rawData = response.data;

            if (type === 'json') return this.parseJSON(rawData);
            if (type === 'csv') return this.parseCSV(rawData);
            if (type === 'html') return this.parseHTML(rawData);

            throw new Error("Desteklenmeyen veri tipi.");
        } catch (err) {
            console.error("Fetch Hatası:", err.message);
            throw err;
        }
    },

    parseJSON(data) {
        // Beklenen format: [{ word: '...', trans: '...' }, ...] veya { word: 'trans' }
        if (Array.isArray(data)) {
            return data.map(item => ({
                source: item.source_word || item.word || item.src,
                target: item.target_word || item.translation || item.target || item.trans,
                hint: item.context_hint || item.hint || ''
            })).filter(i => i.source && i.target);
        }
        return Object.entries(data).map(([k, v]) => ({
            source: k,
            target: v,
            hint: ''
        }));
    },

    parseCSV(data) {
        const lines = data.split('\n');
        return lines.map(line => {
            const [source, target, hint] = line.split(',').map(s => s.trim());
            return { source, target, hint: hint || '' };
        }).filter(i => i.source && i.target);
    },

    parseHTML(data) {
        // Basit bir regex tabanlı parser (DOM kütüphanesi yerine hafif olması için)
        // Beklenen: <li><span>word</span>: <span>translation</span></li> vb.
        const pairs = [];
        const regex = /<li>.*?<b>(.*?)<\/b>.*?<i>(.*?)<\/i>.*?<\/li>/gi;
        let match;
        while ((match = regex.exec(data)) !== null) {
            pairs.push({ source: match[1], target: match[2], hint: 'HTML Import' });
        }
        return pairs;
    },

    /**
     * Dil Kategorizasyonu ve Ön-İşleme
     */
    preprocess(pairs, sourceLang, targetLang) {
        return pairs.map(p => {
            let cleanedSource = p.source.trim();
            let cleanedTarget = p.target.trim();

            // POS (Part of Speech) Tespiti - Basit Heuristic
            let hint = p.hint;
            if (!hint) {
                if (cleanedSource.endsWith('ing')) hint = 'verb (gerund)';
                else if (cleanedSource.length > 10) hint = 'complex word';
            }

            return {
                source: cleanedSource,
                target: cleanedTarget,
                hint: hint,
                source_lang: sourceLang,
                target_lang: targetLang
            };
        });
    }
};

module.exports = ScraperService;
