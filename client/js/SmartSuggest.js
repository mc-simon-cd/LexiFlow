/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */

const SmartSuggest = {
    timeout: null,
    async handleInput(val) {
        const container = document.getElementById('suggestContainer');
        if (!val || val.length < 2) { container.classList.add('hidden'); return; }

        clearTimeout(this.timeout);
        this.timeout = setTimeout(async () => {
            try {
                const response = await API.getSuggestions(val);
                if (response.suggestions && response.suggestions.length > 0) {
                    container.innerHTML = response.suggestions.map(s => `
                        <div class="suggestion-item p-2 flex justify-between items-center border-b border-slate-50 last:border-0 group/sug">
                            <div class="flex flex-col cursor-pointer flex-1" onclick="SmartSuggest.select('${s.word}', '${s.translation}')">
                                <span class="font-bold text-indigo-700 text-xs">${s.word}</span>
                                <span class="text-[10px] text-slate-500">${s.translation}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="flex flex-col items-end mr-2" data-tooltip="AI Güveni: %${Math.round(s.score * 100)}">
                                    <span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md scale-90 font-medium text-[9px] flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                                        ${s.label}
                                    </span>
                                </div>
                                <div class="flex gap-1 opacity-0 group-hover/sug:opacity-100 transition-opacity">
                                    <button onclick="SmartSuggest.select('${s.word}', '${s.translation}', true)" class="p-1 hover:bg-emerald-50 text-emerald-500 rounded" title="Kabul Et (Deftere Ekle)">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    </button>
                                    <button onclick="SmartSuggest.reject()" class="p-1 hover:bg-rose-50 text-rose-300 hover:text-rose-500 rounded" title="Yoksay">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                    container.classList.remove('hidden');
                } else { container.classList.add('hidden'); }
            } catch (e) { container.classList.add('hidden'); }
        }, 200); // 200ms Debounce
    },
    async select(word, translation, autoSave = false) {
        document.getElementById('srcWord').value = word;
        document.getElementById('targetWord').value = translation;
        document.getElementById('suggestContainer').classList.add('hidden');
        if (autoSave) await addWord();
    },
    reject() {
        document.getElementById('suggestContainer').classList.add('hidden');
    }
};
