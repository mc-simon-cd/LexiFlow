# 🛠️ Kurulum ve Dağıtım Klavuzu

Bu döküman, **LexiFlow** projesini yerel ve üretim (production) ortamlarında nasıl kuracağınızı ve yaygın sorunları nasıl çözeceğinizi açıklar.

---

## 📋 Ön Gereksinimler

- **Docker & Docker Compose** (Konteynerize kurulum için)
- **Node.js (v18+)** (Yerel geliştirme için)
- **NPM** (Paket yönetimi için)

---

## 🐳 1. Docker ile Kurulum (SQLite Production)

Bu yöntem, `sqlite3` bağımlılığını Alpine tabanlı konteynerde yerel olarak derler ve yüksek performans sağlar.

### Adım 1: Servisleri Başlatın
```bash
docker-compose up -d --build
```

### Adım 2: Veri Kalıcılığı
Veritabanınız projenizdeki `server/dictionary.db` dosyasında saklanır ve konteyner içine mount edilir. Bu sayede verileriniz her zaman güvendedir.

---

## 🔧 Sorun Giderme (Troubleshooting)

### Docker Build Hatası (Native Modules)
Eğer `sqlite3` derlenirken hata alıyorsanız, Docker imajı multi-stage build kullanarak bu araçları otomatik yükler. İnternet bağlantınızı kontrol edin.

### Port Çakışması (EADDRINUSE)
Eğer sunucu başlarken "port already in use" hatası alıyorsanız, 3000 portunu şu komutla temizleyin:
```bash
sudo fuser -k 3000/tcp
```
Ardından servisi tekrar başlatın.

---

## 🗃️ Veritabanı Notları

- **Kalıcı Veri**: Docker üzerinde verileriniz `dictionary_data` volume'ünde saklanır. Konteyner silinse bile verileriniz kaybolmaz.
- **SQLite -> MySQL Göçü**: SQLite verilerinizi MySQL'e taşımak için önce arayüz üzerinden **"Dışa Aktar"** (JSON) yapın, Docker ile MySQL kurulumunu tamamladıktan sonra **"İçe Aktar"** seçeneğini kullanın.

---

**Simon Project** - *Daha akıllı dil araçları için.*
