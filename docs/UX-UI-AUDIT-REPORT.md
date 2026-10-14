# UX/UI & Motion Design Audit — RuangLagi

**Tanggal:** 14 Oktober 2026
**Target:** `https://ruanglagi.vercel.app/` dan source repo lokal
**Jenis audit:** inspeksi source + GET HTTP read-only; tidak ada perubahan aplikasi, data, konfigurasi deployment, atau dependensi.

## Ringkasan eksekutif

Empat URL publik yang diminta untuk alur awal merespons HTTP 200. Respons server beranda dan katalog memuat tautan produk dan gambar (3/2 pada beranda, 4/2 pada katalog saat GET), jadi observasi lama tentang katalog kosong tidak berlaku pada respons yang diperiksa hari ini. Ini hanya bukti HTML server saat itu, bukan bukti bahwa gambar berhasil dimuat di browser atau interaksi bekerja.

Source menunjukkan sistem visual yang sudah cukup konsisten: palet forest/cream/peach, DM Serif Display dan DM Sans, frame foto peach, state kosong/error, reduced motion, serta fokus global. Risiko terbesar dari audit ini ada pada panel autentikasi yang disembunyikan dengan `aria-hidden` tetapi belum dinonaktifkan dari urutan keyboard, batas ukuran upload 5 MB yang melebihi batas request Vercel 4.5 MB, slider harga dengan rentang sampai 2.147.483.647, serta animasi masuk kartu yang menskalakan seluruh kartu dan berjalan 650 ms.

**Kesiapan UX:** belum bisa dinyatakan siap. Pemeriksaan browser, keyboard, viewport, pembaca layar, pengukuran performa, serta integrasi upload live tidak dilakukan. Tidak ada screenshot karena browser automation tidak tersedia.

## Cakupan halaman dan alur

| Area / route                                                 | Status                          | Bukti dan batasan                                                                                                                                                 |
| ------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beranda `/`                                                  | GET 200 + source reviewed       | 46.464 byte; 3 tautan produk dan 2 tag gambar pada HTML yang diterima. Tidak memeriksa layout/hydration.                                                          |
| Katalog `/products`                                          | GET 200 + source reviewed       | 68.589 byte; 4 tautan produk dan 2 tag gambar pada HTML. Form pencarian, sort, filter, pagination ditinjau statis; tidak diklik.                                  |
| Detail `/products/[id]` dan pemesanan `/products/[id]/order` | Source reviewed                 | Gambar, informasi produk, seller, dan CTA terlihat pada source; pembelian tidak dicoba.                                                                           |
| Login/daftar `/login`, `/register`                           | GET 200 + source reviewed       | Respons 36.712/36.719 byte; animasi pengalaman auth diperiksa dari source, tanpa autentikasi atau keyboard test.                                                  |
| Wishlist/favorites, pesanan, notifikasi, profil, toko        | Source routes reviewed          | Tersedia dalam route inventory. Konten privat tidak diuji dengan akun. `/favorites` mengarah ke alias `/wishlist` menurut laporan HTTP terdahulu.                 |
| Dashboard produk baru/edit/list                              | Source reviewed                 | Form dan image uploader diperiksa dari source; tidak mengunggah atau mengubah data.                                                                               |
| Admin overview/pengguna/produk/pesanan/alamat/audit log      | Source route inventory reviewed | Tidak mengakses area admin atau menguji role.                                                                                                                     |
| Loading, error, 404                                          | Source reviewed                 | `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx` dan padanan admin tersedia. Tidak memaksa error runtime.                                      |
| Cart, chat, review, payment gateway                          | Tidak ditemukan                 | Tidak ada route/fitur yang cocok pada inventory source; alur pemesanan yang ada bukan bukti fitur-fitur ini tersedia. Konfirmasi apakah memang di luar scope MVP. |

## Temuan berprioritas

P0: tidak ada temuan yang dapat dipastikan dari pemeriksaan ini.

### 1. P1 — Kontrol pada panel auth tersembunyi bisa tetap masuk urutan Tab

- **Bukti:** `src/components/forms/auth-experience.tsx:74,101` memberi `aria-hidden` ke sisi form tidak aktif, tetapi form anak tidak diberi `inert` atau mekanisme setara pada source yang diperiksa.
- **Reproduksi/verifikasi:** buka `/login`, pindah mode, lalu tekan Tab berulang; pastikan fokus tidak masuk ke kontrol panel yang tidak terlihat. Ulangi dengan pembaca layar.
- **Dampak:** pengguna keyboard/pembaca layar dapat fokus atau mengirim kontrol yang secara visual disembunyikan; state visual dan state aksesibilitas dapat berbeda.
- **Saran:** saat panel tidak aktif, keluarkan seluruh subtree dari keyboard/aksesibilitas (misalnya `inert` yang didukung versi browser target), lalu pulihkan fokus secara eksplisit saat berganti mode.
- **Risiko:** perpindahan fokus bisa terasa membingungkan jika panel berubah ketika fokus berada di dalamnya.
- **Verifikasi:** browser keyboard + NVDA/VoiceOver, login ke register dan sebaliknya, reduced motion.

### 2. P1 — Batas upload 5 MB berpotensi ditolak sebelum mencapai handler di Vercel

- **Bukti:** uploader menampilkan batas 5 MB (`src/components/forms/image-uploader.tsx:155-162`); laporan website audit yang ada mencatat route upload melewati Vercel Functions dengan batas request 4.5 MB. Multipart overhead ikut memakai batas request. Konflik ini belum diuji dengan upload produksi pada audit ini.
- **Reproduksi/verifikasi:** di staging terisolasi, kirim file di beberapa ukuran dekat batas 4.5–5 MB dan amati status respons serta hasil Storage; jangan gunakan data produksi untuk uji mutasi.
- **Dampak:** file yang menurut UI valid dapat gagal sebelum kode aplikasi memprosesnya, menghasilkan feedback yang tidak sesuai harapan.
- **Saran:** pilih alur upload yang disetujui untuk batas 5 MB (misalnya upload langsung berotorisasi ke storage) atau sepakati batas baru lalu samakan UI, validasi, dan dokumentasi.
- **Risiko:** perubahan batas atau arsitektur berdampak pada pengalaman dan kontrak upload.
- **Verifikasi:** staging dengan bucket terpisah, uji batas termasuk multipart, pastikan validasi kepemilikan/tujuan tetap diterapkan.

### 3. P2 — Slider harga memakai rentang yang terlalu besar untuk kontrol visual

- **Bukti:** `src/components/product/filter.tsx:7,50-71` menetapkan maksimum slider `2_147_483_647` dan membatasi kedua slider ke nilai tersebut; input angka ada di sampingnya.
- **Reproduksi/verifikasi:** buka filter katalog dan geser rentang pada layar sentuh/keyboard; bandingkan resolusi gerak dengan harga produk yang nyata.
- **Dampak:** rentang praktis menjadi sulit dipilih dengan slider; nilai input besar juga tidak tercermin sebagai skala kontrol yang berguna.
- **Saran:** tentukan batas slider dari distribusi harga produk yang benar, atau batasi slider ke rentang praktis dan biarkan input angka menangani nilai di atasnya. Angka batas bisnis belum diputuskan, jadi jangan menebaknya.
- **Risiko:** batas salah dapat menyembunyikan item mahal atau mengubah hasil filter.
- **Verifikasi:** keyboard, sentuh, harga minimum/maksimum, nilai di atas batas slider, query URL.

### 4. P2 — Animasi masuk menskalakan kartu produk secara keseluruhan dan lambat

- **Bukti:** `src/app/globals.css:124-145` menganimasikan `scale` dari 0.96 ke 1, state tersembunyi memakai `scale: 0.94`, durasi 650 ms; `src/components/product/product-card-reveal.tsx:22-31,40` memakai observer dan delay berdasarkan index dari `src/components/product/cards.tsx`.
- **Reproduksi/verifikasi:** buka katalog/beranda dengan beberapa hasil dan amati kartu saat masuk viewport, scroll turun-naik, dan aktifkan pengaturan reduced motion.
- **Dampak:** scale pada keseluruhan kartu dapat terasa seperti popup; delay bertingkat dan durasi panjang menunda kemunculan konten. Efek aktual dan potensi flash sebelum observer aktif tetap perlu browser test.
- **Saran:** pertimbangkan fade-up singkat hanya dengan opacity/translate pada wrapper, tanpa scale kartu, dan pastikan konten langsung terlihat jika observer tidak tersedia atau animasi dimatikan.
- **Risiko:** pengurangan motion dapat mengubah karakter visual yang baru disetujui untuk kartu.
- **Verifikasi:** reload, scroll masuk/keluar viewport, JS/observer fallback, prefers-reduced-motion, serta browser kelas rendah.

### 5. P2 — Foto kartu memakai crop `object-cover`, bisa memotong barang

- **Bukti:** `src/components/product/product-card-image.tsx:27-34` merender gambar `object-cover` di frame rasio 4:5 pada `src/components/product/cards.tsx:98-103`.
- **Reproduksi/verifikasi:** uji foto portrait, landscape, barang panjang, barang dengan bagian/cacat penting di tepi pada grid mobile dan desktop.
- **Dampak:** batas produk atau detail kondisi bisa terpotong sehingga pembeli kurang dapat menilai barang sebelum membuka detail.
- **Saran:** pertahankan frame dengan sudut membulat, tetapi evaluasi `object-contain`/posisi crop yang bisa diatur untuk foto produk; jangan mengubah foto profil/logo dengan aturan yang sama tanpa uji konteks.
- **Risiko:** `object-contain` dapat meninggalkan ruang kosong; crop khusus menambah kontrol bagi penjual.
- **Verifikasi:** set gambar representatif dan tinjau grid serta halaman detail pada ukuran target.

### 6. P2 — Filter katalog mobile tampil inline melalui disclosure, bukan panel ringkas

- **Bukti:** `src/components/product/filter.tsx:174-180` menggunakan `<details>` untuk layar di bawah `lg`; katalog menaruh aside dan hasil dalam grid responsif di `src/app/products/page.tsx:99-105`.
- **Reproduksi/verifikasi:** pada viewport 360×800 dan 390×844 buka filter, ganti kategori/harga/kondisi/lokasi, lalu lihat panjang scroll dan apakah hasil/aksi terapan tetap jelas.
- **Dampak:** kumpulan filter dapat memakan area awal dan membuat pengguna sulit berpindah antara pilihan filter dengan daftar hasil. Belum terbukti terjadi di runtime.
- **Saran:** jika uji mobile mengonfirmasi friksi, gunakan dialog/bottom sheet yang mempertahankan elemen form, submit, URL query, dan akses keyboard; tetap sediakan disclosure sederhana jika lebih sesuai hasil usability test.
- **Risiko:** perubahan pola dapat mengubah urutan fokus dan kebutuhan tombol terapkan/reset.
- **Verifikasi:** keyboard, screen reader, scroll internal, submit/reset, back/forward URL di mobile.

### 7. P2 — Badge “Baru diunggah” memakai teks 10–11 px

- **Bukti:** `src/components/product/cards.tsx:191` memakai `text-[10px]` dan `sm:text-[11px]` untuk badge informatif.
- **Reproduksi/verifikasi:** cek badge pada frame foto di lebar mobile, zoom browser 200%, dan kontras aktual.
- **Dampak:** label kondisi listing berpotensi sukar dibaca, terutama pada layar kecil atau pengguna low vision.
- **Saran:** naikkan teks informatif menjadi minimal 12 px dan cek panjang badge terhadap frame.
- **Risiko:** badge menutup area foto lebih besar; tata ulang posisi hanya jika uji visual menunjukkan tabrakan.
- **Verifikasi:** viewport 360 px, 200% zoom, font scaling, kontras render.

### 8. P2 — Batas navigasi `/products/[id]/order` tidak tampak sebagai cart/checkout terpisah

- **Bukti:** route inventory memiliki halaman detail dan route pemesanan per produk, tetapi tidak ada route cart/checkout/payment gateway yang terpisah.
- **Reproduksi/verifikasi:** telusuri jalur dari CTA detail hingga halaman order dengan akun staging; audit statis ini tidak mengirim pesanan.
- **Dampak:** bila pengguna mengharapkan keranjang multi-item, pembayaran langsung, chat, atau penawaran, ekspektasi itu tidak tercakup dalam flow yang ditemukan.
- **Saran:** konfirmasi batas MVP dan jelaskan langkah transaksi/konfirmasi yang benar pada copy UI; jangan menambahkan fitur sebelum scope diputuskan.
- **Risiko:** asumsi audit dapat salah jika ada alur eksternal/fitur di luar route yang diperiksa.
- **Verifikasi:** walkthrough dengan buyer dan seller staging, mencakup sukses, dibatalkan, menunggu, dan error.

### 9. P3 — Placeholder gambar kartu tidak menyediakan tindakan pemulihan

- **Bukti:** `src/components/product/product-card-image.tsx:14-23,33-34` mengganti gambar gagal dengan ikon placeholder; tidak ada retry control di komponen.
- **Reproduksi/verifikasi:** blokir request satu gambar atau gunakan URL rusak di staging/browser dan amati fallback serta cara membuka gambar/detail.
- **Dampak:** gambar hilang tampak seperti item tanpa foto; pembeli tidak tahu apakah gambar gagal atau memang tidak tersedia.
- **Saran:** beri status visual singkat yang jelas tanpa menutupi kartu; jika gambar transient dan retry aman, sediakan retry pada detail/uploader, bukan tombol ambigu pada setiap kartu.
- **Risiko:** label tambahan dapat memenuhi area kartu kecil.
- **Verifikasi:** URL 404/timeout, keyboard focus, layout shift, fallback `alt`.

### 10. P3 — Feedback dan skeleton belum dievaluasi dalam transisi nyata

- **Bukti:** `src/app/loading.tsx:1-5` dan `src/app/admin/loading.tsx:1-5` memakai skeleton `animate-pulse`/`aria-live`; `src/app/error.tsx` dan `src/app/admin/error.tsx` menyediakan reset. Keberadaan source belum membuktikan kapan state tampil atau pengumumannya terdengar.
- **Reproduksi/verifikasi:** throttling jaringan, memaksa kegagalan route di staging, lalu cek pembaca layar dan apakah skeleton menyerupai konten tujuan.
- **Dampak:** loading yang terlalu lama atau pesan status yang tidak diumumkan dapat membuat pengguna mengulang aksi; error global bisa memberi konteks terbatas.
- **Saran:** validasi state dengan jaringan lambat/error dan pastikan status loading/error diberi nama yang diumumkan serta aksi ulang yang jelas.
- **Risiko:** skeleton yang terlalu detail atau live announcement berulang bisa menambah gangguan.
- **Verifikasi:** jaringan lambat, route gagal, reduced motion, pembaca layar, no-JS/error boundary.

## Visual, motion, responsif, aksesibilitas, performa

- **Visual dari source:** token forest/cream/peach/sage dan DM Serif Display/DM Sans sudah diterapkan. Hero beranda memakai forest dan foto arch; kartu memakai frame peach. Ini bukan penilaian komposisi hasil render.
- **Motion dari source:** reduced-motion rules ada di `src/app/globals.css`; animasi auth dan komponen Radix juga ditinjau. Perlu menguji prefers-reduced-motion di browser serta membandingkan durasi/stagger dengan prefers-reduced-motion.
- **Responsif:** implementasi memiliki breakpoint Tailwind dan grid responsif; belum diuji pada 360×800, 390×844, 768×1024, 1366×768, 1440×900 atau zoom 200%. Tidak ada klaim bebas overflow.
- **Aksesibilitas:** ada landmark, label, beberapa `focus-visible`, dan teks alt pada source. Belum ada keyboard-only, pembaca layar, kontras render, target tap aktual, axe, atau WCAG conformance test.
- **Performa:** tidak ada Lighthouse, Core Web Vitals, waterfall, ukuran asset aktual dari browser, atau test jaringan lambat. Jumlah tag `<img>` pada HTML bukan ukuran performa gambar.
- **Browser evidence:** tidak ada screenshot karena browser automation tidak tersedia; GET HTTP tidak memeriksa CSS, JavaScript hydration, console, pemuatan gambar, atau interaksi.

## Pemeriksaan dan hasil

| Pemeriksaan                                                      | Hasil                                                                                                                                                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET produksi `/`, `/products`, `/login`, `/register`             | PASS — semua 200 pada waktu audit; hanya respons HTTP.                                                                                                                                                  |
| `npm run lint`                                                   | PASS — ESLint keluar 0.                                                                                                                                                                                 |
| `npm run typecheck`                                              | PASS — `tsc --noEmit` keluar 0.                                                                                                                                                                         |
| `npm test -- --reporter=dot`                                     | PASS — 39 file, 208 test; ada peringatan deprecation Vite CJS dan satu log error yang memang diuji oleh test upload metadata failure.                                                                   |
| `npm run db:validate`                                            | PASS — Prisma schema valid; tidak tersambung ke database.                                                                                                                                               |
| `npm run format:check`                                           | FAIL — Prettier menandai 14 file, termasuk file kerja berstatus berubah dan beberapa dokumen/source lain. Tidak menjalankan format otomatis agar perubahan lain tidak tersentuh.                        |
| Browser desktop/mobile, keyboard, pembaca layar, visual, console | NOT TESTED — tidak ada browser automation pada lingkungan audit ini.                                                                                                                                    |
| Lighthouse / Web Vitals / performa                               | NOT TESTED.                                                                                                                                                                                             |
| Upload Storage live, order, OAuth                                | NOT TESTED — tidak ada mutasi produksi.                                                                                                                                                                 |
| Build                                                            | NOT RUN — audit ini tidak membutuhkan build; tidak menghapus `.next` atau menghentikan proses.                                                                                                          |
| Dependency audit                                                 | NOT RERUN — laporan `docs/WEBSITE-AUDIT-REPORT.md` yang ada mencatat 15 advisories (`npm audit`) dan 4 High pada audit production-only saat 2026-10-14; perlu pengecekan ulang sebelum keputusan rilis. |

## Perubahan repo dan keadaan kerja

- Ditambahkan: `docs/UX-UI-AUDIT-REPORT.md`.
- Tidak ada perubahan kode aplikasi, API, schema, dependency, data, atau deployment.
- Perubahan sebelumnya yang belum di-commit tetap ada: `src/app/globals.css`, `src/app/page.tsx`, `src/components/product/cards.tsx`, `src/components/product/favorite-button.tsx`, serta file baru `src/components/product/product-card-image.tsx` dan `src/components/product/product-card-reveal.tsx`. Audit tidak membatalkan atau menimpa perubahan tersebut.

## Rencana perbaikan yang disarankan

1. Konfirmasi apakah pengguna menganggap panel auth tersembunyi/tab order dan slider harga sebagai prioritas; tentukan batas harga yang benar sebelum mengubah filter.
2. Putuskan kebijakan upload 5 MB versus request platform, lalu siapkan staging terisolasi untuk pengujian upload.
3. Uji kartu pada browser dengan reduced motion, ukuran produk crop, gambar gagal, dan viewport target; baru sesuaikan entrance animation.
4. Jalankan review aksesibilitas keyboard/pembaca layar dan mobile flow katalog serta order.
5. Setelah perubahan yang disetujui, ulangi lint, typecheck, test, format check; build/preview dan browser visual check pada workspace/deployment yang aman.

**Butuh persetujuan sebelum redesign besar:** ya. Sepuluh temuan di atas merupakan daftar audit dan rekomendasi, bukan perubahan yang telah dilakukan.
