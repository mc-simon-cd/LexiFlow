/**
 * Simon Project - LexiFlow
 * MIT License
 * Copyright (c) 2026 Simon Project
 */

/**
 * ApiService Sınıfı
 * Tüm HTTP isteklerini merkezi bir yapı üzerinden yönetir.
 */
class ApiService {
    constructor(baseUrl = 'http://localhost:3000/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Merkezi İstek Yönetici (Interceptor Mantığı)
     */
    async _request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);

            // Global Hata Yakalayıcı (Interceptor)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `İşlem başarısız (Hata Kodu: ${response.status})`;

                // HTTP Durum Kodlarına Göre Özel Mesajlar
                switch (response.status) {
                    case 404:
                        throw new Error("İstenilen kaynak sunucuda bulunamadı (404).");
                    case 500:
                        throw new Error("Sunucu tarafında bir hata oluştu (500).");
                    default:
                        throw new Error(errorMessage);
                }
            }

            return await response.json();
        } catch (error) {
            // Ağ hataları veya bağlantı sorunları
            if (error.message === 'Failed to fetch') {
                throw new Error("Sunucuya bağlanılamadı. Lütfen backend servisinin çalıştığından emin olun.");
            }
            throw error;
        }
    }

    /**
     * Tüm sözlüğü getir
     */
    async fetchWords() {
        return await this._request('/words');
    }

    /**
     * Yeni kelime ekle veya güncelle
     */
    async saveWord(word, translation, hint = null) {
        return await this._request('/words', {
            method: 'POST',
            body: JSON.stringify({ word, translation, hint })
        });
    }

    /**
     * Kelime sil
     */
    async deleteWord(word) {
        return await this._request(`/words/${encodeURIComponent(word)}`, {
            method: 'DELETE'
        });
    }

    async analyzeNLP(word) {
        return await this._request('/analyze-nlp', {
            method: 'POST',
            body: JSON.stringify({ word })
        });
    }

    /**
     * AI Tabanlı Kelime Önerileri
     */
    async getSuggestions(query) {
        return await this._request(`/suggest?q=${encodeURIComponent(query)}`);
    }

    /**
     * Toplu içe aktarma
     * Stratejiler: 'skip', 'update', 'replace'
     */
    async importData(data, strategy = 'skip') {
        return await this._request('/import', {
            method: 'POST',
            body: JSON.stringify({ data, strategy })
        });
    }

    /**
     * Toplu dışa aktarma
     */
    async exportData() {
        return await this._request('/export');
    }
}

// Global instance (opsiyonel, uygulama içinde paylaşılan tek bir servis örneği)
const api = new ApiService();
