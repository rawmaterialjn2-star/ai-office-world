# AI OFFICE WORLD — MAYORA JAYANTI 2

Starter local-first untuk game show 5 ronde:

1. **AI Quick Answer** — Lobby Mayora
2. **Sound Battle** — Gudang Raw Material
3. **Jangan Bilang Kata Itu** — Produksi / Process
4. **AI Gerak Cepat** — Packing / Finish Good
5. **AI Chaos** — Office

## Yang sudah diperbaiki

- Next.js App Router + TypeScript
- Versi dependency dipatok agar install konsisten
- Host dashboard
- TV arena
- Satu QR untuk satu room
- Peserta scan → isi nama → langsung masuk
- Maksimal 6 pemain aktif
- Score, level, combo dasar
- 5 lokasi dan 5 ronde
- Camera/mic permission dasar di HP
- UI tidak bergantung CDN/font internet
- Server listen ke `0.0.0.0` agar bisa diakses melalui LAN
- QR dibuat oleh server dan mengikuti host yang sedang dibuka

## Versi Node

Gunakan **Node.js 22 LTS**. File `.nvmrc` sudah disediakan.

## Jalankan di Windows

Buka CMD/PowerShell di folder project:

```bash
npm install
npm run dev
```

Cari IP laptop:

```bash
ipconfig
```

Cari:

```text
Wireless LAN adapter Wi-Fi
IPv4 Address : 192.168.1.204
```

Dalam contoh ini IP laptop adalah `192.168.1.204`.

### Penting: buka alamat LAN, bukan localhost

Di laptop buka:

```text
http://192.168.1.204:3000
```

Jangan memakai:

```text
http://localhost:3000
```

untuk layar yang akan menampilkan QR ke peserta.

Karena QR mengikuti alamat halaman, jika TV/laptop dibuka lewat `192.168.1.204`, peserta akan mendapat QR yang mengarah ke:

```text
http://192.168.1.204:3000/play/MJ2-DEMO
```

### URL TV

```text
http://192.168.1.204:3000/arena/MJ2-DEMO
```

### URL Host

```text
http://192.168.1.204:3000/host
```

Peserta cukup scan QR dari halaman utama.

## Jaringan lokal

Laptop dan HP harus tersambung ke Wi-Fi/router yang sama. Router **tidak harus memiliki internet** untuk game core.

Contoh:

```text
Wi-Fi lokal
   │
   ├── Laptop 192.168.1.204
   ├── HP Rina
   ├── HP Andi
   ├── HP Budi
   ├── HP Santi
   ├── HP Dedi
   └── HP Rudi
```

Jika Windows Firewall menampilkan permintaan izin untuk Node.js, izinkan akses pada **Private networks**.

## Catatan camera

Starter ini baru menyiapkan permission dan preview camera di HP. Untuk **Round 4 camera HP → TV secara live**, kita akan menambahkan WebRTC + signaling lokal pada tahap berikutnya.

Akses kamera melalui HTTP LAN dapat diblokir oleh beberapa browser karena kebutuhan secure context (HTTPS). Jadi jangan menganggap fitur camera live sudah selesai hanya dari starter ini.

## Catatan state

MVP ini menggunakan state di memory proses Next.js agar gampang diuji di satu laptop. Untuk versi event final, game state akan dipindahkan ke penyimpanan/realtime yang lebih kuat dan tetap dibuat local-first.
