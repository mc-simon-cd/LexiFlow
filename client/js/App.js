/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */

const AppState = { dictionary: {}, isLoaded: false, isOnline: true };

function showToast(m, t) { UI.showToast(m, t); }

/**
 * CORE ACTIONS
 */
async function initApp() {
    UI.setLoading(true, 'list');
    try {
        AppState.dictionary = await api.fetchWords();
        AppState.isLoaded = true;
        AppState.isOnline = true;
        UI.renderList();
        TranslatorEngine.translate();
        handleMigration();
    } catch (err) { console.error(err); UI.setFailSafe(err.message); } finally { UI.setLoading(false, 'list'); }
}

async function handleMigration() {
    const oldData = localStorage.getItem('my_dictionary_app');
    if (oldData) {
        try {
            const data = JSON.parse(oldData);
            if (Object.keys(data).length > 0) {
                if (confirm("Local veriler bulundu. Bulut hesabınıza aktarılsın mı?")) {
                    await api.importData(data, 'update');
                    localStorage.removeItem('my_dictionary_app');
                    showToast("Göç başarılı.");
                    await initApp();
                }
            }
        } catch (e) { }
    }
}

async function addWord() {
    const src = document.getElementById('srcWord').value.trim().toLowerCase();
    const target = document.getElementById('targetWord').value.trim();
    const hint = document.getElementById('contextHint').value.trim();
    if (src && target) {
        try {
            UI.setLoading(true, 'button');
            await api.saveWord(src, target, hint);
            document.getElementById('srcWord').value = "";
            document.getElementById('targetWord').value = "";
            document.getElementById('contextHint').value = "";
            await initApp();
            showToast("Yeni kelime deftere kaydedildi.");
        } catch (err) { } finally { UI.setLoading(false, 'button'); }
    }
}

async function deleteWord(key) {
    try {
        UI.setLoading(true, 'list');
        await api.deleteWord(key);
        await initApp();
        showToast(`"${key}" kelimesi silindi.`);
    } catch (err) { } finally { UI.setLoading(false, 'list'); }
}

async function clearAll() {
    if (confirm("Tüm sözlüğü temizlemek istediğinize emin misiniz?")) {
        try {
            UI.setLoading(true, 'list');
            await api.importData({}, 'replace');
            await initApp();
            showToast("Tüm sözlük temizlendi.");
        } catch (err) { } finally { UI.setLoading(false, 'list'); }
    }
}

function triggerImport() { document.getElementById('fileInput').click(); }

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file || file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            window.pendingImportData = JSON.parse(e.target.result);
            document.getElementById('conflictModal').classList.replace('hidden', 'flex');
        } catch (err) { showToast("Geçersiz JSON", "error"); }
    };
    reader.readAsText(file);
}

async function resolveConflict(strategy) {
    try {
        UI.setLoading(true, 'list');
        const response = await api.importData(window.pendingImportData, strategy);
        await initApp();
        hideConflictModal();
        const r = response.report;
        showToast(`Aktarım Tamamlandı: ${r.success} yeni, ${r.updated} güncellenen.`);
    } catch (err) { hideConflictModal(); } finally { UI.setLoading(false, 'list'); }
}

function hideConflictModal() { document.getElementById('conflictModal').classList.replace('flex', 'hidden'); }

async function handleExport() {
    try {
        const response = await api.exportData();
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sozluk_yedek_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        showToast("Sözlük başarıyla ihraç edildi.");
    } catch (err) { }
}

document.addEventListener('DOMContentLoaded', initApp);
