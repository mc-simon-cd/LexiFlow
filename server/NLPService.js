/**
 * NLPService.js
 * Türkçe Morfolojik Analiz ve Kök Belirleme (Stemming) Modülü
 */

/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */
const NLPService = {
    // Türkçe ek listesi (Öncelik sırasına göre tersten ayıklama için)
    suffixes: [
        // Çoğul ekleri
        { pattern: /l[ae]r$/, label: "Plural" },
        // Hal ekleri
        { pattern: /d[ae]$/, label: "Locative" },
        { pattern: /d[ae]n$/, label: "Ablative" },
        { pattern: /(y)?[ae]$/, label: "Dative" },
        { pattern: /(y)?ı$/, label: "Accusative" },
        { pattern: /(y)?i$/, label: "Accusative" },
        { pattern: /(y)?u$/, label: "Accusative" },
        { pattern: /(y)?ü$/, label: "Accusative" },
        // İyelik ekleri
        { pattern: /[ıiuü]m$/, label: "Possessive 1sg" },
        { pattern: /[ıiuü]n$/, label: "Possessive 2sg" },
        { pattern: /(s)?[ıiuü]$/, label: "Possessive 3sg" },
        // Yapım ekleri (Meslek vb.)
        { pattern: /c[ıiuü]$/, label: "Occupational" },
        { pattern: /ç[ıiuü]$/, label: "Occupational" },
        { pattern: /l[ıiuü]k$/, label: "Noun-to-Noun" }
    ],

    /**
     * Bir kelimenin kökünü bulmaya çalışır (Basitleştirilmiş Stemmer)
     */
    analyze(word) {
        let current = word.toLowerCase();
        let foundSuffixes = [];
        let iterations = 0;
        const maxIterations = 3; // En fazla 3 ek ayıklasın (örn: kitap-çı-lar-da)

        while (iterations < maxIterations) {
            let matched = false;
            for (const suffix of this.suffixes) {
                if (current.length > 3 && suffix.pattern.test(current)) {
                    foundSuffixes.unshift(suffix.label);
                    current = current.replace(suffix.pattern, '');
                    matched = true;
                    break;
                }
            }
            if (!matched) break;
            iterations++;
        }

        return {
            original: word,
            root: current,
            suffixes: foundSuffixes,
            score: current.length > 2 ? 0.9 : 0.4 // Kök anlamlılığa göre güven skoru
        };
    }
};

module.exports = NLPService;
