# Yönetim Sistemi - Desktop Uygulaması

Web uygulamasının masaüstü sürümü.

## Kurulum

### Kullanıcılar için

[Releases](../../releases) sayfasından platformunuza uygun dosyayı indirin:

- **Windows**: `Yönetim Sistemi Setup.exe`
- **Mac**: `Yönetim Sistemi.dmg`
- **Linux**: `yonetim-sistemi.AppImage`

### Geliştiriciler için

```bash
cd electron
npm install
npm start
```

## Build Komutları

```bash
npm run build:mac    # Mac için .dmg
npm run build:win    # Windows için .exe
npm run build:linux  # Linux için .AppImage
```

## Yeni Sürüm Yayınlama

```bash
git tag v1.0.0
git push origin v1.0.0
```

Bu komut GitHub Actions'ı tetikler ve otomatik olarak:

1. Mac, Windows, Linux için build yapar
2. GitHub Releases'e yükler
3. İndirme linkleri oluşturur
