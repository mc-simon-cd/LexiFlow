CLAUDE.md - Sözcük Defteri Çeviri Algoritması

Bu dosya, projenin mimari kararlarını ve geliştirme ilkelerini içerir.

1. Proje Özeti

Kullanıcı tanımlı bir sözlük üzerinden metin çevirisi yapan, API tabanlı ve Makine Öğrenimi destekli bir web uygulamasıdır.

2. Teknoloji Yığını

Frontend: Vanilla JavaScript (ES6+), Tailwind CSS.

ML Katmanı: TensorFlow.js (İstemci tarafı çıkarım) veya Python/NLP API.

Backend: SQL Veritabanı ve RESTful API.

Veri Yönetimi: localStorage yasaktır. Tüm veriler API üzerinden yönetilir.

3. Mimari Kurallar

AI-Driven: Çeviri motoru, statik eşleşme bulamazsa veya belirsizlik (ambiguity) varsa ML modeline başvurmalıdır.

Hybrid Engine: Önce sözlük kuralları (N-Gram), ardından ML tabanlı bağlam analizi çalışır.

Standardizasyon: ML önerileri kullanıcı arayüzünde "Yapay Zeka Önerisi" etiketiyle belirtilmelidir.

4. Kodlama Standartları

Performance: ML modelleri asenkron yüklenmeli, ana arayüzün akıcılığını bozmamalıdır.

Fallback: API veya ML servisi yanıt vermezse temel sözlük algoritmasına geri dönülmelidir.
