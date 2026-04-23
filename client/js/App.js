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
window.switchView = (page) => UI.switchTab(page === 'notebook' ? 'notebook' : 'translate');

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

    const progressContainer = document.getElementById('importProgressContainer');
    const progressBar = document.getElementById('importProgressBar');
    const progressText = document.getElementById('importProgressText');

    progressContainer.classList.remove('hidden');
    UI.showToast("Veri madenciliği başlatıldı...", "info");

    // Simüle edilmiş progress (API stream desteklemediği için görsel amaçlı)
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        if (progress > 90) clearInterval(interval);
        progressBar.style.width = `${progress}%`;
        progressText.innerText = `${progress}%`;
    }, 200);

    try {
        const result = await API.importExternal(url, type, AppState.source_lang, AppState.target_lang);
        clearInterval(interval);
        progressBar.style.width = `100%`;
        progressText.innerText = `100%`;

        UI.showToast(`${result.count} kelime başarıyla ayıklandı ve eklendi!`, "success");
        setTimeout(() => {
            UI.hideImportModal();
            progressContainer.classList.add('hidden');
            progressBar.style.width = `0%`;
            window.changeLanguage();
        }, 1000);
    } catch (err) {
        clearInterval(interval);
        progressContainer.classList.add('hidden');
        UI.showToast("Madencilik başarısız: " + err.message, "error");
    }
};

window.handleBulkParse = async () => {
    const text = document.getElementById('bulkPasteArea').value;
    if (!text.trim()) return UI.showToast("Metin girilmedi", "error");

    // Regex: Kelime ve çeviri çiftlerini algıla (-, :, , destekler)
    const regex = /(.+?)(?:\s*[-:,]\s*)(.+?)(?:\n|$)/g;
    const items = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        items.push({
            source: match[1].trim(),
            target: match[2].trim(),
            hint: 'Toplu Giriş'
        });
    }

    if (items.length === 0) return UI.showToast("Uyumlu format bulunamadı", "warning");

    UI.showToast(`${items.length} kelime işleniyor...`, "info");
    let count = 0;
    for (const item of items) {
        try {
            await API.saveWord(item.source, item.target, item.hint, AppState.source_lang, AppState.target_lang);
            count++;
        } catch (e) { }
    }

    UI.showToast(`${count} kelime başarıyla eklendi!`, "success");
    document.getElementById('bulkPasteArea').value = "";
    window.changeLanguage();
};

window.handleAutoIngest = async () => {
    const sourceId = document.getElementById('autoSourceSelect').value;
    const limit = parseInt(document.getElementById('autoSourceLimit').value) || 1000;
    const pair = `${AppState.source_lang}-${AppState.target_lang}`;

    UI.showToast("Otomatik aktarım başladı...", "info");
    UI.setLoading(true, 'list');
    try {
        const result = await API.triggerAutoIngest(sourceId, limit, pair);
        UI.showToast(`Aktarım Tamamlandı: ${result.report.success} yeni kelime eklendi.`, "success");
        window.changeLanguage(); // Yenile
    } catch (err) {
        UI.showToast("Otomatik aktarım başarısız: " + err.message, "error");
    } finally {
        UI.setLoading(false, 'list');
    }
};

window.handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    UI.showToast(`${file.name} okunuyor...`, "info");
    UI.setLoading(true, 'list');

    reader.onload = async (e) => {
        try {
            const content = e.target.result;
            let data = {};

            if (file.name.endsWith('.json')) {
                data = JSON.parse(content);
            } else if (file.name.endsWith('.csv')) {
                // Basit CSV Parser
                const lines = content.split('\n');
                lines.forEach(line => {
                    const parts = line.split(/[;,]/);
                    if (parts.length >= 2) {
                        const key = parts[0].trim().toLowerCase();
                        if (!data[key]) data[key] = [];
                        data[key].push({ translation: parts[1].trim(), hint: parts[2]?.trim() || 'CSV Import' });
                    }
                });
            }

            const response = await API.importData(data, AppState.source_lang, AppState.target_lang);
            UI.showToast(`Yükleme Başarılı: ${response.count} kelime eklendi.`, "success");
            window.changeLanguage();
        } catch (err) {
            UI.showToast("Dosya işleme hatası: " + err.message, "error");
        } finally {
            UI.setLoading(false, 'list');
            event.target.value = ""; // Reset input
        }
    };
    reader.readAsText(file);
};
window.handleExportDoc = async (format) => {
    const lang = document.getElementById('exportLang').value;
    const sort = document.getElementById('exportSort').value;
    const scope = document.getElementById('exportScope').value;

    UI.showToast(`Belge hazırlanıyor (${format.toUpperCase()})...`, "info");
    UI.setLoading(true, 'full');

    try {
        const params = new URLSearchParams({ lang_pair: lang, sort, scope });
        const response = await fetch(`${API.baseUrl}/export/${format}?${params}`);
        if (!response.ok) throw new Error("İndirme hatası");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lexiflow_export_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        UI.showToast("Belgeniz başarıyla hazırlandı", "success");
    } catch (err) {
        UI.showToast("Belge oluşturulamadı: " + err.message, "error");
    } finally {
        UI.setLoading(false, 'full');
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

document.addEventListener('DOMContentLoaded', initApp);
