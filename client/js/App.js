/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */

const AppState = {
    dictionary: {},
    isOnline: true,
    isLoaded: false,
    source_lang: 'en',
    target_lang: 'tr'
};

/**
 * INITIALIZATION
 */
async function initApp() {
    UI.setLoading(true, 'full');
    try {
        AppState.dictionary = await API.fetchWords(AppState.source_lang, AppState.target_lang);
        AppState.isOnline = true;
        AppState.isLoaded = true;
        UI.renderList();
        TranslatorEngine.translate();
        UI.showToast(`${AppState.source_lang.toUpperCase()} - ${AppState.target_lang.toUpperCase()} Sözlüğü Hazır`, 'success');
    } catch (err) {
        console.error(err);
        UI.setFailSafe(err.message);
    } finally {
        UI.setLoading(false, 'full');
    }
}

/**
 * GLOBAL HANDLERS (Scope: window)
 */
window.switchTab = (tabId) => UI.switchTab(tabId);

window.changeLanguage = async () => {
    AppState.source_lang = document.getElementById('langSource').value;
    AppState.target_lang = document.getElementById('langTarget').value;
    AppState.isLoaded = false;
    UI.setLoading(true, 'list');
    try {
        AppState.dictionary = await API.fetchWords(AppState.source_lang, AppState.target_lang);
        AppState.isLoaded = true;
        UI.renderList();
        TranslatorEngine.translate();
    } catch (err) {
        UI.showToast("Dil yükleme hatası", "error");
    } finally {
        UI.setLoading(false, 'list');
    }
};

window.startScraper = async () => {
    const url = document.getElementById('importUrl').value;
    const type = document.getElementById('importType').value;
    if (!url) return UI.showToast("Lütfen bir URL girin", "error");

    UI.showToast("Veri madenciliği başlatıldı...", "info");
    try {
        const result = await API.importExternal(url, type, AppState.source_lang, AppState.target_lang);
        UI.showToast(`${result.count} kelime başarıyla ayıklandı ve eklendi!`, "success");
        UI.hideImportModal();
        window.changeLanguage(); // Yenile
    } catch (err) {
        UI.showToast("Madencilik başarısız: " + err.message, "error");
    }
};

/**
 * CRUD OPERATIONS
 */
async function addWord() {
    const src = document.getElementById('srcWord').value.trim();
    const target = document.getElementById('targetWord').value.trim();
    const hint = document.getElementById('contextHint').value.trim();

    if (!src || !target) return;

    UI.setLoading(true, 'button');
    try {
        await API.saveWord(src, target, hint, AppState.source_lang, AppState.target_lang);
        document.getElementById('srcWord').value = "";
        document.getElementById('targetWord').value = "";
        document.getElementById('contextHint').value = "";

        // State Update (Local merge to avoid reload)
        const key = src.toLowerCase();
        if (!AppState.dictionary[key]) AppState.dictionary[key] = [];
        AppState.dictionary[key].push({ target_word: target, hint, source_lang: AppState.source_lang, target_lang: AppState.target_lang });

        UI.renderList();
        UI.showToast("Kelime deftere eklendi", 'success');
    } catch (err) {
        UI.showToast("Hata oluştu: " + err.message, 'error');
    } finally {
        UI.setLoading(false, 'button');
    }
}

async function deleteWord(key) {
    if (!confirm(`"${key}" kelimesini silmek istediğinize emin misiniz?`)) return;
    try {
        UI.setLoading(true, 'list');
        await API.deleteWord(key); // Not: API.deleteWord parametre uyumuna dikkat
        delete AppState.dictionary[key.toLowerCase()];
        UI.renderList();
        UI.showToast(`"${key}" silindi.`, "success");
    } catch (err) {
        UI.showToast("Silme hatası", "error");
    } finally {
        UI.setLoading(false, 'list');
    }
}

async function clearAll() {
    if (confirm("Seçili dil çiftindeki TÜM kelimeleri temizlemek üzeresiniz! Devam edilsin mi?")) {
        try {
            UI.setLoading(true, 'list');
            await API.importData({}, 'replace'); // Basitleştirildi
            AppState.dictionary = {};
            UI.renderList();
            UI.showToast("Sözlük temizlendi.", "success");
        } catch (err) {
            UI.showToast("Temizleme hatası", "error");
        } finally {
            UI.setLoading(false, 'list');
        }
    }
}

async function handleExport() {
    try {
        const response = await API.exportData();
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lexiflow_export_${AppState.source_lang}_${AppState.target_lang}.json`;
        a.click();
        UI.showToast("Dışa aktarım başarıyla tamamlandı.", "success");
    } catch (err) {
        UI.showToast("Dışa aktarım hatası", "error");
    }
}

document.addEventListener('DOMContentLoaded', initApp);
