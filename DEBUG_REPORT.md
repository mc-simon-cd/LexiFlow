# LexiFlow Project Audit & Debug Report (2026-04-23)

Bu rapor, LexiFlow codebase'i üzerinde yapılan derinlemesine hata taraması ve sistem sağlığı analizini içerir.

## 🔍 Tespit Edilen & Giderilen Sorunlar

### 1. API Bağlantı Mimarisi (Kritik - Çözüldü ✅)
- **Sorun**: `ApiService.js` içinde global örnek `api` olarak tanımlanırken, `App.js` içinde `API` olarak çağrılıyordu.
- **Etki**: Uygulama başlatılamıyor ve konsolda "API is not defined" hatası veriyordu.
- **Çözüm**: İsimlendirme `API` olarak standardize edildi.

### 2. Metod Çakışmaları (Orta - Çözüldü ✅)
- **Sorun**: `ApiService.js` içinde `importData` fonksiyonu hem v1 hem v3 sürümü için iki farklı şekilde tanımlanmıştı.
- **Etki**: Dosya yükleme işlemleri sırasında dil çiftleri doğru işlenmiyordu çünkü eski sürüm yenisini eziyordu.
- **Çözüm**: Legacy (v1.0) kodlar temizlendi ve dile duyarlı v3 motoru aktif edildi.

---

## 🛠️ Potansiyel Riskler & Öneriler

### 1. Dosya Boyutu Sınırı (Backend)
- **Durum**: `server.js` dosyasında JSON limiti `5mb` olarak ayarlanmış. 
- **Risk**: Çok büyük (10.000+ kelime) CSV/JSON dosyaları yüklendiğinde `PayloadTooLargeError` alınabilir.
- **Öneri**: Limit ihtiyaca göre `10mb` seviyesine çıkarılabilir veya veri "stream" edilerek işlenebilir.

### 2. CSV Ayrıştırma Hassasiyeti (Frontend)
- **Durum**: `App.js` içinde `split(/[;,]/)` kullanılarak basit bir ayrıştırma yapılıyor.
- **Risk**: Kelime veya anlam içinde virül/noktalı virgül (Örn: "elma, kırmızı"; "fruit") varsa ayrıştırma bozulur.
- **Öneri**: Profesyonel bir CSV kütüphanesi (papaparse vb.) frontend tarafına da eklenebilir.

### 3. Veritabanı Migration (db.js)
- **Durum**: `UNIQUE` constraint sonradan eklendi.
- **Risk**: Eski veritabanı dosyalarında aynı kelime farklı diller için çakışma yaratabilir.
- **Öneri**: Her dilli girişin (source_word, source_lang, target_lang) gerçekten özgün olduğundan emin olunmalı.

---

## ✅ Sistem Sağlık Durumu
- **Frontend Engine**: Stabil (N-Gram & Stemming aktif).
- **Backend API**: Fonksiyonel (Bütün uç noktalar cevap veriyor).
- **Veri Güvenliği**: SQL Injection koruması (Parameterized queries) mevcut.
- **UI/UX**: Responsive ve modern (Glassmorphism uyumlu).

*Rapor Sonu - Simon Project Audit Team*
