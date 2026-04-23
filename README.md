# 📘 LexiFlow

**LexiFlow**, bağlamsal zeka, NLP (Doğal Dil İşleme) ve modern UI/UX prensipleriyle donatılmış, Simon Project bünyesinde geliştirilen yeni nesil bir akıllı sözlük ve çeviri algoritması projesidir.

---

## 🚀 Öne Çıkan Özellikler

- **🧠 Bağlamsal Çözümleme (ML)**: TensorFlow.js entegrasyonu sayesinde kelimelerin birden fazla anlamı arasından (polysemy), cümle içeriğine en uygun olanı otomatik olarak seçer.
- **🔍 Türkçe NLP Desteği**: Gelişmiş morfolojik analiz (stemming) ile "kitapçılar" gibi ek almış kelimelerin köklerini ("kitap") otomatik tespit eder.
- **💡 Smart-Suggest**: Kelime eklerken benzerlik ve AI tahminlerini kullanarak anlık öneriler sunar (Tam Eşleşme, Önek, Fuzzy Matching).
- **📦 Docker & MySQL Ready**: Üretim (production) standartlarında, MySQL 8.0 tabanlı, güvenli ve konteynerize edilmiş altyapı (Port 3000).
- **🎨 Modern UI/UX**: Shimmer skeleton ekranlar, interaktif AI etiketleri, güven skorları ve profesyonel hata yönetimi.
- **📥 Gelişmiş Veri Yönetimi**: JSON tabanlı toplu veri dışa/içe aktarma ve çatışma çözümleme (Skip, Update, Replace) stratejileri.

---

## 🛠️ Teknoloji Yığını

- **Frontend**: Vanilla JS, Tailwind CSS, TensorFlow.js (CDN).
- **Backend**: Node.js, Express.
- **Veritabanı**: MySQL 8.0 (Production), SQLite (Development).
- **DevOps**: Docker, Docker Compose.

---

## ⚙️ Kurulum ve Dağıtım

Detaylı kurulum adımları, Docker yapılandırması ve sorun giderme notları için **[docs/INSTALL.md](docs/INSTALL.md)** dosyasına göz atabilirsiniz.

### Hızlı Başlangıç (Docker)

### Adım 2: Servisleri Başlatın
Kod değişikliklerinin ve yeni yapılandırmanın aktif olması için her zaman `--build` parametresini kullanmanız önerilir:
```bash
docker-compose up -d --build
```

### Adım 3: Kontrol Edin
Servislerin durumunu şu komutla izleyebilirsiniz:
```bash
docker-compose ps
```
API servisine şu adresten erişebilirsiniz: **http://localhost:3000**

### 💻 Yerel Geliştirme (SQLite)

1. Gerekli bağımlılıkları yükleyin:
   ```bash
   cd server && npm install
   ```
2. Sunucuyu başlatın:
   ```bash
   npm start
   ```
3. `index.html` dosyasını tarayıcınızda açın.

---

## 📜 Lisans

Bu proje **Simon Project**'e aittir ve **MIT Lisansı** altında lisanslanmıştır. Daha fazla bilgi için [LICENSE](LICENSE) dosyasına göz atabilirsiniz.

---

**Simon Project** - *Yapay Zeka ile Güçlendirilmiş Dil Çözümleri.*
