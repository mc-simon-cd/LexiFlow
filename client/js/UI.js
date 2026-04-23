/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */

const UI = {
    // ... existing setLoading ...
    setLoading(isLoading, mode = 'full') {
        if (mode === 'full') {
            const loader = document.getElementById('loadingState');
            if (loader) { if (isLoading) loader.classList.remove('hidden'); else loader.classList.add('hidden'); }
        } else if (mode === 'list') {
            const skeleton = document.getElementById('listSkeleton');
            const content = document.getElementById('listContent');
            const empty = document.getElementById('emptyState');
            if (isLoading) {
                skeleton.classList.remove('hidden');
                content.classList.add('hidden');
                empty.classList.add('hidden');
            } else {
                skeleton.classList.add('hidden');
                content.classList.remove('hidden');
            }
        } else if (mode === 'button') {
            const btn = document.getElementById('addBtn');
            const btnText = document.getElementById('addBtnText');
            const spinner = document.getElementById('addBtnSpinner');
            if (btn && btnText && spinner) {
                if (isLoading) { btn.disabled = true; btnText.classList.add('opacity-0'); spinner.classList.remove('hidden'); }
                else { btn.disabled = false; btnText.classList.remove('opacity-0'); spinner.classList.add('hidden'); }
            }
        }
    },

    switchTab(tabId) {
        document.getElementById('view-translate').classList.toggle('hidden', tabId !== 'translate');
        document.getElementById('view-notebook').classList.toggle('hidden', tabId !== 'notebook');

        document.getElementById('tab-translate').className = tabId === 'translate'
            ? "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all bg-white text-indigo-600 shadow-sm"
            : "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all text-slate-500 hover:bg-white/50";

        document.getElementById('tab-notebook').className = tabId === 'notebook'
            ? "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all bg-white text-indigo-600 shadow-sm"
            : "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all text-slate-500 hover:bg-white/50";
    },

    renderList() {
        const list = document.getElementById('listContent');
        const empty = document.getElementById('emptyState');
        const keys = Object.keys(AppState.dictionary).sort();
        document.getElementById('wordCount').innerText = keys.length;

        list.innerHTML = "";
        if (keys.length === 0 && AppState.isLoaded) { empty.classList.remove('hidden'); return; }
        else { empty.classList.add('hidden'); }

        keys.forEach(key => {
            const meanings = AppState.dictionary[key];
            const div = document.createElement('div');
            div.className = "p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all group shadow-sm flex justify-between items-start";
            div.innerHTML = `
                <div class="flex flex-col">
                    <span class="text-sm font-extrabold text-slate-800">${key}</span>
                    <div class="flex flex-wrap gap-2 mt-2">
                        ${meanings.map(m => `
                            <span class="text-[10px] bg-slate-50 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-50 font-bold">
                                ${m.target_word} ${m.hint ? `<span class="text-slate-400 font-normal ml-1">(${m.hint})</span>` : ''}
                            </span>
                        `).join('')}
                    </div>
                </div>
                <button onclick="deleteWord('${key}')" class="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
            `;
            list.appendChild(div);
        });
    },

    showImportModal() { document.getElementById('importModal').classList.replace('hidden', 'flex'); },
    hideImportModal() { document.getElementById('importModal').classList.replace('flex', 'hidden'); },
    // ... existing setFailSafe, showToast, renderAIBadge ...

    setFailSafe(error) {
        AppState.isOnline = false;
        document.body.classList.add('is-offline');
        document.getElementById('status').innerText = "Bağlantı Yok";
        document.getElementById('errorModal').classList.replace('hidden', 'flex');
        TranslatorEngine.disable();
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        const icon = type === 'success'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

        const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-rose-500';
        toast.className = `${bgColor} text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right-full duration-300`;
        toast.innerHTML = `${icon} <span class="text-sm font-semibold">${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.replace('slide-in-from-right-full', 'slide-out-to-right-full');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    renderAIBadge(score, type) {
        const pct = Math.round(score * 100);
        return `
            <span class="inline-flex items-center gap-0.5 px-1 ml-1 bg-indigo-50 text-indigo-500 rounded text-[9px] font-bold cursor-help border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors" 
                  data-tooltip="AI Önerisi (${type}) - Güven: %${pct}">
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                AI
            </span>
        `;
    }
};
