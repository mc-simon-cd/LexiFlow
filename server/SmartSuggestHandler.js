/**
 * SmartSuggestHandler.js
 * AI Tabanlı Öneri Sistemi - Alıcı/Verici Mimarisi
 */

/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */
const SmartSuggestHandler = {
    /**
     * Receiver Modülü: Giriş verilerini yakalar ve normalize eder.
     */
    Receiver: {
        normalize(query) {
            if (!query) return null;
            return query.trim().toLowerCase();
        }
    },

    /**
     * Engine: Kelime benzerliği ve ML tahmini yapar.
     */
    Engine: {
        // Basit bir Levenshtein mesafesi algoritması (Fuzzy Search için)
        levenshtein(a, b) {
            const matrix = [];
            for (let i = 0; i <= b.length; i++) matrix[i] = [i];
            for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b.charAt(i - 1) === a.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                    }
                }
            }
            return matrix[b.length][a.length];
        },

        async getMatches(db, query) {
            return new Promise((resolve, reject) => {
                // Hem tam eşleşme hem de benzerleri ara
                db.all('SELECT source_word, target_word, context_hint FROM words', [], (err, rows) => {
                    if (err) return reject(err);

                    const results = rows.map(row => {
                        const distance = SmartSuggestHandler.Engine.levenshtein(query, row.source_word);
                        let score = 0;
                        let label = "Sözlük";

                        // Benzerlik skoru hesapla (Daha düşük mesafe = Daha yüksek skor)
                        if (row.source_word === query) {
                            score = 1.0;
                            label = "Tam Eşleşme";
                        } else if (row.source_word.startsWith(query)) {
                            score = 0.8;
                            label = "Önek";
                        } else if (distance < 3) {
                            score = 0.5;
                            label = "Fuzzy";
                        }

                        // ML Simülasyonu: Eğer ipucu (hint) varsa skor artır
                        if (row.context_hint) {
                            score += 0.1;
                            label = "AI Önerisi";
                        }

                        return {
                            word: row.source_word,
                            translation: row.target_word,
                            score: Math.min(score, 1.0),
                            label: label
                        };
                    })
                        .filter(r => r.score > 0.4)
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 5);

                    resolve(results);
                });
            });
        }
    },

    /**
     * Sender Modülü: Sonuçları istemci formatında paketler.
     */
    Sender: {
        package(matches) {
            return {
                timestamp: new Date().getTime(),
                count: matches.length,
                suggestions: matches
            };
        }
    }
};

module.exports = SmartSuggestHandler;
