# Changelog - LexiFlow

Bütün sürümler ve yapılan yeniliklerin dökümü.

## [v3.1.0] - İndirme Merkezi & Pro Raporlama (2026-04-23)
### Eklendi
- **Export Center**: Kelimelerin PDF, Excel ve CSV formatlarında indirilebilmesi sağlandı.
- **Profesyonel PDF**: Şık tablo düzeni ve başlıklarla donatılmış çalışma kağıdı üreticisi eklendi.
- **Filtreleme**: Dışa aktarmadan önce dil çifti ve sıralama (A-Z, Tarih) seçenekleri eklendi.

## [v3.0.0] - Otomatik Veri Çekim (Auto-Ingest) (2026-04-23)
### Eklendi
- **AutoIngestionService**: Harici JSON/CSV kaynaklarından otomatik veri çekme motoru.
- **Akıllı Kaynaklar (Smart Sources)**: Önceden tanımlanmış kütüphanelerin tek tıkla sisteme aktarımı.
- **Format Algılama**: Verinin yapısını (JSON/CSV) otomatik tanıyıp ayrıştıran katman.

## [v2.1.0] - Performans & Hızlı Giriş (2026-04-23)
### Eklendi
- **Bulk Paste Parser**: Metinlerden ( - , : , ) ayrıştırarak toplu kelime girişi.
- **Veri Bütünlüğü**: Veritabanı seviyesinde `UNIQUE` kısıtlaması ile mükerrer kayıt engeli.
- **Progress Bar**: Veri çekme ve madencilik işlemleri için görsel ilerleme çubuğu.

## [v2.0.0] - Çoklu Dil Devrimi (2026-04-23)
### Eklendi
- **Multi-Lang Core**: Birden fazla dil çifti (EN-TR, DE-TR, FR-TR) desteği.
- **Language Switcher**: Arayüzden anlık dil değiştirme imkanı.
- **Sekmeli Navigasyon**: "Akıllı Çeviri" ve "Defter" görünümlerinin ayrıştırılması.

## [v1.1.0] - LexiFlow Rebranding (2026-04-23)
### Eklendi
- **Marka Kimliği**: Proje ismi "LexiFlow" olarak güncellendi ve yeni logo tasarlandı.
- **Glassmorphism UI**: Arayüz tamamen premium ve modern bir tasarıma kavuşturuldu.
- **Contextual Suggest**: Bağlam duyarlı kelime önerileri.

## [v1.0.0] - İlk Sürüm (2026-04-23)
### Eklendi
- SQLite tabanlı kalıcı veri saklama.
- N-Gram tabanlı greedy çeviri motoru.
- Dockerize edilmiş full-stack mimari.
- Temel kelime ekleme, silme ve arama özellikleri.

---
*Simon Project tarafından geliştirilmektedir.*
