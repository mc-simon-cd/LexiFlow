# Build Aşaması
FROM node:18-alpine AS builder

# SQLite3 derlemesi için gerekli araçları yükle
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

# Bağımlılıkları kopyala ve yükle
COPY server/package*.json ./server/
WORKDIR /usr/src/app/server
RUN npm install --production

# Uygulama kodlarını ve frontend dosyalarını kopyala
WORKDIR /usr/src/app
COPY server/ ./server/
COPY client/ ./client/

# Çalışma Aşaması
FROM node:18-alpine

# Runtime için gerekli kütüphaneler (SQLite3 binary için)
RUN apk add --no-cache libc6-compat

WORKDIR /usr/src/app

# Builder'dan tüm yapıyı kopyala
COPY --from=builder /usr/src/app .

# Uygulama portunu belirt
EXPOSE 3000

# Uygulamayı ana dizinden başlat
CMD ["node", "server/server.js"]
