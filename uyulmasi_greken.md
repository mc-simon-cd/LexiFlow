Proje Geliştirme Planı: Sözcük Defteri Çeviri Aracı

Bu belge, kullanıcı tanımlı bir sözlük üzerinden metin çevirisi yapan algoritmanın modüler gelişim yol haritasını tanımlar.

1. Mimari Yapı ve Modüller

Proje, her biri bağımsız olarak geliştirilebilen 4 ana katmandan oluşacaktır:

A. Veri Katmanı (Data Layer)

Sözlük Yapısı: JSON tabanlı anahtar-değer (Key-Value) çiftleri.

Kalıcılık (Persistence): * Kısa vadede: localStorage ile tarayıcıda saklama.

Orta vadede: JSON dosyası olarak dışa aktarma/içe aktarma (Export/Import).

Uzun vadede: Bulut veritabanı (Firestore) entegrasyonu.

B. İşlemci Modülü (The Processor / Tokenizer)

Parçalayıcı: Metni kelimeler, boşluklar ve noktalama işaretleri olarak atomik parçalara ayırır.

Normalizasyon: Kelimeleri küçük harfe çevirme, gereksiz boşlukları temizleme.

C. Çeviri Motoru (Translation Engine)

Doğrudan Eşleşme: Sözlükteki kelimenin tam karşılığını bulur.

Gelişmiş Eşleşme (N-Gram): "Göz atmak" gibi çoklu kelime öbeklerini tespit eder.

Durum Koruma (Case Sensitivity): Cümle başındaki büyük harfleri veya özel isimleri algılar ve çeviride bu formatı korur.

D. Kullanıcı Arayüzü (UI/UX)

Editör: Kaynak ve hedef metin için yan yana panel.

Sözlük Yöneticisi: Kelime ekleme, arama, filtreleme ve toplu silme özellikleri.

2. Geliştirme Aşamaları (Roadmap)

Aşama 1: Temel Fonksiyonellik (MVP - Minimum Viable Product)

[x] Temel UI tasarımı (Tailwind CSS).

[x] Kelime bazlı parçalama (Regex Tokenizer).

[x] Basit Case-sensitivity (Büyük/Küçük harf) kontrolü.

[x] Manuel kelime ekleme/çıkarma.

Aşama 2: Veri Yönetimi ve Kullanılabilirlik

[ ] Yerel Depolama: Sayfa yenilendiğinde sözlüğün kaybolmaması için localStorage entegrasyonu.

[ ] Dosya Desteği: Sözlüğü .json veya .csv olarak indirme ve yükleme.

[ ] Arama ve Filtreleme: Sözlük içinde hızlı arama yapabilme.

Aşama 3: Dilbilgisi ve Zeka (Smart Logic)

[ ] Çoklu Kelime Öbekleri: Sözlükte "take care" gibi ifadelerin tek bir birim olarak çevrilmesi.

[ ] Kök Bulma (Stemming): "Elmalar" kelimesini "Elma" köküne indirgeyerek çevirme yeteneği.

[ ] Ek Yönetimi: Çevrilen kelimeye uygun ekleri (İngilizce -s takısı gibi) ekleme denemeleri.

Aşama 4: Gelişmiş Özellikler ve Entegrasyon

[ ] Karanlık Mod: Göz yormayan tema seçeneği.

[ ] İstatistikler: En çok çevrilen kelimeler, sözlük doluluk oranı.

[ ] API Entegrasyonu: Sözlükte bulunmayan kelimeler için isteğe bağlı olarak Google/Gemini API desteği.

3. Teknik Gereksinimler

Frontend: HTML5, Tailwind CSS, JavaScript (ES6+).

Veri Formatı: JSON.

Regex: ([\s,.!?;:]) (Noktalama ve boşluk ayırıcıları için).

4. Karşılaşılabilecek Zorluklar & Çözümler

Zorluk: "Okul" -> "School" ama "Okula" ne olacak?

Çözüm: Basit bir "Suffix" (Ek) tablosu oluşturulmalı veya kelime köklerine bakılmalı.

Zorluk: Eşsesli kelimeler (Yüz - Face / Hundred).

Çözüm: Kullanıcının sözlüğe "etiket" (context) eklemesine izin verilmeli.
