/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */

/**
 * CONTEXTUAL RESOLVER (Bağlamsal Çözümleme - ML/Heuristic)
 */
const ContextualResolver = {
    async resolve(word, currentSentence, candidates, returnFull = false) {
        if (candidates.length === 1) {
            return returnFull ? { translation: candidates[0].target_word, score: 1.0, isAI: false } : candidates[0].target_word;
        }

        const tokens = currentSentence.toLowerCase().split(/\s+/);
        let bestMatch = candidates[0];
        let maxScore = -1;

        candidates.forEach(cand => {
            let score = 0;
            if (cand.context_hint) {
                const hints = cand.context_hint.toLowerCase().split(/\s+/);
                tokens.forEach(token => {
                    if (hints.includes(token)) score += 1;
                });
            }
            if (score > maxScore) {
                maxScore = score;
                bestMatch = cand;
            }
        });

        const isAI = maxScore > 0;
        const confidence = isAI ? 0.95 : 0.6; // Simüle edilmiş skor

        return returnFull ? { translation: bestMatch.target_word, score: confidence, isAI: isAI } : bestMatch.target_word;
    }
};

/**
 * TRANSLATOR ENGINE (N-Gram & Stemming Fallback)
 */
const TranslatorEngine = {
    applyCaseLogic(source, target) {
        const tr = 'tr-TR';
        if (source === source.toLocaleUpperCase(tr) && source !== source.toLocaleLowerCase(tr)) return target.toLocaleUpperCase(tr);
        if (source[0] === source[0].toLocaleUpperCase(tr) && source[0] !== source[0].toLocaleLowerCase(tr)) return target.charAt(0).toLocaleUpperCase(tr) + target.slice(1).toLocaleLowerCase(tr);
        return target.toLocaleLowerCase(tr);
    },
    async translate() {
        if (!AppState.isOnline) return;
        const text = document.getElementById('inputText').value;
        if (!text) { document.getElementById('outputText').innerText = "Sonuç..."; return; }
        const tokens = text.split(/([\s,.!?;:])/g);
        const translated = [];
        let i = 0;
        while (i < tokens.length) {
            const currentToken = tokens[i];
            if (!currentToken || currentToken.match(/[\s,.!?;:]/)) { translated.push(currentToken); i++; continue; }
            let matchFound = false;
            for (let n = 3; n >= 1; n--) {
                let wordCount = 0;
                let tempIndex = i;
                let phraseTokens = [];
                let wordsInPhrase = [];
                while (tempIndex < tokens.length && wordCount < n) {
                    const t = tokens[tempIndex];
                    if (!t) break;
                    const isDelimiter = t.match(/[\s,.!?;:]/);
                    const isWhitespace = t.match(/^\s+$/);
                    if (!isDelimiter) { wordCount++; wordsInPhrase.push(t.toLowerCase()); } else if (wordCount > 0 && wordCount < n && !isWhitespace) { wordCount = -1; break; }
                    phraseTokens.push(t);
                    tempIndex++;
                }
                if (wordCount === n) {
                    const phraseKey = wordsInPhrase.join(" ");
                    let candidates = AppState.dictionary[phraseKey];

                    // 1. Doğrudan Sözlük Kontrolü
                    if (candidates) {
                        const resolution = await ContextualResolver.resolve(phraseKey, text, candidates, true);
                        const finalResult = this.applyCaseLogic(phraseTokens[0], resolution.translation);
                        const badge = resolution.isAI ? UI.renderAIBadge(resolution.score, "Context") : "";
                        translated.push(`${finalResult}${badge}`);
                        i = tempIndex;
                        matchFound = true;
                        break;
                    }

                    // 2. NLP Stemming Kontrolü (Sadece tek kelimeler için)
                    if (n === 1) {
                        try {
                            const analysis = await API.analyzeNLP(phraseKey);
                            if (analysis && analysis.root !== phraseKey) {
                                const rootCandidates = AppState.dictionary[analysis.root];
                                if (rootCandidates) {
                                    const resolution = await ContextualResolver.resolve(analysis.root, text, rootCandidates, true);
                                    const finalResult = this.applyCaseLogic(phraseTokens[0], resolution.translation);
                                    const badge = UI.renderAIBadge(analysis.score, "NLP");
                                    translated.push(`<span class="border-b border-indigo-200" title="Kök: ${analysis.root}">${finalResult}${badge}</span>`);
                                    i = tempIndex;
                                    matchFound = true;
                                    break;
                                }
                            }
                        } catch (e) { console.error("NLP Hatası:", e); }
                    }
                }
            }
            if (!matchFound) { translated.push(tokens[i]); i++; }
        }
        document.getElementById('outputText').innerHTML = translated.join("");
    },
    disable() {
        document.getElementById('inputText').value = "";
        document.getElementById('outputText').innerText = "Hizmet Kesintisi";
        document.getElementById('status').innerText = "Bağlantı Hatası!";
        document.getElementById('status').classList.replace('text-slate-400', 'text-red-500');
    }
};
