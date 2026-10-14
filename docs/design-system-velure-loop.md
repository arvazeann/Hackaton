# Design System Velure Loop

Acuan visual untuk marketplace fashion preloved **Velure Loop** (tagline: "Pre-loved, Still Loved").
Dokumen ini dipakai agent sebagai target saat menyelaraskan tampilan **RuangLagi** (lihat bagian 14).

Sumber: audit implementasi Velure Loop. Nilai bertanda `~` adalah perkiraan yang bergantung viewport.

---

## 1. Gaya dan mood

- **Gaya:** editorial fashion, warm organic, curated vintage boutique, sustainable marketplace.
- **Mood:** tenang, premium, jujur, feminin, berkelanjutan. Terasa seperti butik kurasi, bukan pasar loak.
- **Audiens:** pembeli dan penjual fashion preloved yang ingin kondisi dan asal barang dijelaskan dengan jelas.
- **Urutan perhatian:** foto dan headline hero, lalu kartu item, label kondisi, harga, lalu statistik dampak dan detail listing.
- **Ritme halaman:** header terang, hero cream, statistik peach, katalog cream, section kepercayaan hijau, detail cream, CTA jual peach, footer hijau.

## 2. Warna

| Token            | Hex       | Peran                                                               |
| ---------------- | --------- | ------------------------------------------------------------------- |
| `forest`         | `#0F4C3A` | Section gelap, tombol aktif, identitas brand, judul di latar terang |
| `cream`          | `#FBF1E4` | Latar halaman, kartu dan kontrol terang                             |
| `peach`          | `#F9DFC0` | Frame produk, permukaan sekunder                                    |
| `orange`         | `#FF5A00` | CTA utama, diskon, garis penanda, fokus aktif                       |
| `sage`           | `#DCE8D8` | Badge kondisi dan verifikasi                                        |
| `sage-surface`   | `#E9EEE3` | Catatan kondisi                                                     |
| `warm-surface`   | `#F5E9DA` | Statistik dampak, section jual                                      |
| `detail-surface` | `#F6ECDF` | Latar detail item                                                   |
| `ink`            | `#23372E` | Teks utama                                                          |
| `muted`          | `#66736B` | Teks sekunder (sudah dinaikkan kontrasnya dari `#77827A`)           |
| `border`         | `#DDD4C7` | Garis pemisah filter dan kontrol                                    |
| `fair-bg`        | `#F4E1CD` | Latar badge kondisi "Fair"                                          |
| `fair-text`      | `#7C5236` | Teks badge "Fair"                                                   |

**Aturan pemakaian**

- Orange hanya untuk CTA, diskon, dan fokus aktif. Jangan dipakai sebagai latar section atau teks body.
- Sage untuk kondisi, autentikasi, dan status tepercaya. Jangan dipakai sebagai aksen navigasi.
- Rasio komposisi halaman: cream dan permukaan terang ~60%, forest dan teks gelap ~30%, orange ~5%, peach dan sage ~5%.

**Kontras (perkiraan)**

| Kombinasi              | Rasio ~ | Hasil                          |
| ---------------------- | ------: | ------------------------------ |
| `#23372E` di `#FBF1E4` |    11:1 | AAA                            |
| `#FFFFFF` di `#0F4C3A` |     9:1 | AAA                            |
| `#0F4C3A` di `#FBF1E4` |     9:1 | AAA                            |
| `#66736B` di `#FBF1E4` |  ~4.5:1 | AA                             |
| `#FF5A00` di `#FFFFFF` |   3.5:1 | **Gagal AA** untuk teks normal |
| `#315540` di `#DCE8D8` |   6.5:1 | AA                             |

**Perbaikan tombol oranye:** teks putih di `#FF5A00` gagal AA. Pilih salah satu: gelapkan latar tombol ke sekitar `#C94700` (teks putih), atau pakai teks hijau gelap di atas `#FF5A00`. Teks di atas foto perlu overlay.

## 3. Tipografi

- **Display/heading:** Cormorant Garamond (alternatif: Fraunces, Playfair Display, DM Serif Display). Fallback: `Georgia, serif`.
- **Body/UI:** DM Sans (alternatif: Inter). Fallback: `Arial, sans-serif`.

| Peran            |                     Desktop |   Berat | Line-height |                Letter-spacing |
| ---------------- | --------------------------: | ------: | ----------: | ----------------------------: |
| H1 hero          | `clamp(51px, 5.25vw, 73px)` |     400 |       ~0.98 |                       -0.04em |
| H2               |   57-61px (mobile ~46-51px) |     400 |          ~1 |                       -0.04em |
| Display/impact   |                     38-43px |     400 |   0.95-1.06 |                      ~-0.02em |
| Body             |                     13-14px |     400 |        1.65 |                        normal |
| Body kecil       |                        12px |     400 |     1.5-1.8 |                        normal |
| Caption/metadata |                     11-12px |     400 |        ~1.4 | 0.09-0.16em, sering uppercase |
| Tombol           |                     12-14px | 500-600 |      normal |                        normal |
| Eyebrow/label    |                     11-12px |     400 |      normal |             0.15em, uppercase |

**Aturan**

- **Teks informatif minimal 12px.** Implementasi asli memakai 6-9px dan itu dianggap kesalahan, jangan ditiru.
- Judul rata kiri, ~12-16 karakter per baris. Deskripsi body dibatasi 45-65 karakter per baris.
- Judul hijau di latar terang, cream di latar hijau. Muted hanya untuk teks sekunder yang tetap lolos kontras.
- Sentence case untuk tombol; uppercase hanya untuk metadata.

| Peran   | Desktop |  Tablet |  Mobile |
| ------- | ------: | ------: | ------: |
| H1      | 64-73px |    58px |    51px |
| H2      | 57-61px | 53-58px | 46-51px |
| Body    |    14px |    13px | 12-13px |
| Caption | 11-12px | 11-12px |    12px |

## 4. Layout dan grid

| Area                      | Ukuran                                             |
| ------------------------- | -------------------------------------------------- |
| Padding horizontal konten | 8% desktop, 5% tablet, 4% mobile                   |
| Listing desktop           | Sidebar 205px + gap 28px + hasil fleksibel         |
| Listing tablet            | Sidebar 165px + gap 16px                           |
| Listing mobile            | Satu kolom; filter lewat bottom sheet (disarankan) |
| Grid kartu                | 2 kolom di mobile, 3 kolom di desktop              |
| Detail produk             | Desktop `1fr 0.9fr`, gap ~7%; mobile satu kolom    |
| Breakpoint                | 600px dan 820px; tambahkan wide di 1500px          |

Section bergantian cream dan hijau tua dengan whitespace lapang.

## 5. Spacing (basis 4px)

`space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 20 · `space-6` 24 · `space-8` 32 · `space-10` 40 · `space-12` 48 · `space-16` 64 · `space-20` 80 · `space-24` 96

- Jarak antar-section: 64-100px desktop, 48-64px mobile.
- Gap antar komponen terkait: 16-24px.
- Pendekatan ruang: **airy**.

## 6. Bentuk, border, elevasi

| Elemen               |                             Radius |
| -------------------- | ---------------------------------: |
| Tombol dan chip      |                       pill (999px) |
| Kartu / frame produk |           20-24px (16px di mobile) |
| Foto di dalam frame  |           15-16px (11px di mobile) |
| Seller card          |                               16px |
| Badge                |                               pill |
| Tombol wishlist      |                    50% (lingkaran) |
| Hero/story image     | gaya arch (~170px pada sudut atas) |

- Border 1px `#DDD4C7`.
- Elevasi rendah. Shadow hanya untuk overlay dan toast: `0 6px 22px rgb(16 37 31 / 17%)`.
- Tidak memakai glassmorphism, blur, atau tekstur grain.
- Frame produk berlatar peach dengan padding ~9px, foto bersih di dalamnya.

## 7. Komponen

| Komponen         | Spesifikasi                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| Announcement bar | Tinggi 36px, hijau, teks cream                                                    |
| Navbar           | Tinggi ~78px, latar cream, wordmark serif, hover link oranye                      |
| Tombol utama     | Oranye, pill, padding ~15 x 23px, min-width ~205px untuk hero CTA; hover naik 2px |
| Tombol sekunder  | Outline hijau, pill                                                               |
| Chip filter      | Pill, padding 9 x 15px; terpilih = hijau + teks putih                             |
| Kartu produk     | Frame peach, foto, nama, harga; badge kondisi di pojok; tombol heart lingkaran    |
| Badge kondisi    | Pill sage; "Fair" memakai `fair-bg`/`fair-text`; padding 7 x 10px                 |
| Badge verifikasi | Pill cream transparan, teks forest                                                |
| Pagination       | Tombol bulat; aktif forest; **target 44px**                                       |
| Galeri thumbnail | Radius 9px, latar peach, aktif border oranye                                      |
| Seller card      | Avatar 40px, radius 16px, latar cream                                             |
| Aksi detail      | Beli (oranye), Tawar dan Chat (outline), Wishlist (lingkaran sage)                |
| Accordion        | Border bawah beige, judul 12px+, `aria-expanded`                                  |
| Filter sidebar   | Border 1px beige, checkbox, slider berwarna oranye                                |
| Footer           | Hijau; wordmark besar terpotong; teks melengkung                                  |

**State wajib untuk semua kontrol interaktif:** default, hover, active, `:focus-visible`, disabled, selected, loading/error. Selected state tidak boleh hanya mengandalkan warna.

## 8. Ikon dan gambar

- **Ikon:** Lucide atau Phosphor, gaya outline 1.5-2px. Ukuran 16px inline, 20-24px untuk kontrol. Jangan pakai karakter Unicode (`♡`, `✳`) karena bentuknya beda antar OS. Wishlist aktif berupa heart terisi.
- **Foto produk:** latar bersih krem/putih, `aspect-ratio` stabil (mis. 4:5), foto khusus per item termasuk close-up cacat, dengan label eksplisit.
- **Dekorasi (maksimal 2 sekaligus):** asterisk transparan sebagai watermark (~25px pada statistik), wordmark sans besar terpotong di footer (`clamp(100px, 18.9vw, 270px)`), teks melengkung dalam lingkaran (79px, 59px di mobile).

## 9. Motion ("play style")

**Kepribadian:** tenang dan terukur. Tanpa bounce, tanpa parallax berlebihan.

| Elemen                       | Efek              |    Durasi |
| ---------------------------- | ----------------- | --------: |
| Kontrol (tombol, chip, link) | warna, lift 2px   | 160-240ms |
| Kartu produk                 | naik 2px          |     200ms |
| Foto kartu                   | `scale(1.03)`     | 280-400ms |
| Tekan tombol                 | `scale(.98)`      | 100-150ms |
| Toast                        | fade + translateY |     250ms |

Easing: `cubic-bezier(.2,.7,.2,1)`.

```css
:where(button, a, select, input):focus-visible {
  outline: 2px solid #ff5a00;
  outline-offset: 3px;
}

.product-card img {
  transition: transform 320ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.product-card:hover img {
  transform: scale(1.03);
}
button:active {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Wishlist memberi umpan balik lewat ikon, `aria-pressed`, dan counter, bukan hanya toast.

## 10. Perilaku responsif

- **Desktop (>820px):** navigasi penuh, katalog dengan sidebar, detail dua kolom.
- **Tablet (601-820px):** sidebar menyempit ke 165px; detail tetap dua kolom.
- **Mobile (<=600px):** menu drawer, hero bertumpuk, grid kartu dua kolom (lebar kartu minimal ~150px), filter lewat tombol "Filter & urutkan" 44px yang membuka bottom sheet, CTA beli sebagai sticky bar bawah.

## 11. UX dan microcopy

- **Alur:** hero CTA, lalu kategori/filter, lalu listing, lalu cek kondisi, ukuran, dan penjual, lalu beli, tawar, chat, atau wishlist.
- **Urutan informasi detail:** kondisi dan autentikasi, nama dan brand, harga (harga asli dicoret vs harga preloved), catatan cacat, tabel ukuran asli, penjual, aksi, accordion.
- **CTA utama** "Beli sekarang"; Tawar dan Chat bersifat sekunder.
- **Bahasa:** CTA dan instruksi dalam Bahasa Indonesia. Istilah kondisi (Like New, Good, Fair) disertai penjelasan Indonesia.
- **State yang harus ada:** skeleton kartu saat loading, hasil kosong dengan tombol Reset, placeholder saat foto gagal dimuat, pesan gagal dengan opsi coba lagi.

## 12. Aksesibilitas

- Teks informatif minimal 12px; kontras minimal AA.
- Target sentuh minimal 44 x 44px.
- `:focus-visible` jelas di semua kontrol; navigasi keyboard lengkap (Tab, Enter, Space).
- Gunakan `<button>` untuk filter dan thumbnail; `aria-pressed`, `aria-current="page"`, `aria-expanded` pada tempatnya.
- Alt foto mendeskripsikan sudut atau detail kondisi, bukan alt generik.
- Hormati `prefers-reduced-motion`; slider harga menampilkan nilainya.

## 13. Token siap pakai

### CSS variables

```css
:root {
  --color-forest: #0f4c3a;
  --color-cream: #fbf1e4;
  --color-peach: #f9dfc0;
  --color-orange: #ff5a00;
  --color-orange-strong: #c94700; /* latar tombol berteks putih agar lolos AA */
  --color-sage: #dce8d8;
  --color-sage-surface: #e9eee3;
  --color-warm-surface: #f5e9da;
  --color-detail-surface: #f6ecdf;
  --color-ink: #23372e;
  --color-muted: #66736b;
  --color-border: #ddd4c7;
  --color-fair-bg: #f4e1cd;
  --color-fair-text: #7c5236;

  --font-display: "Cormorant Garamond", "Playfair Display", Georgia, serif;
  --font-sans: "DM Sans", Inter, Arial, sans-serif;

  --radius-card: 1.25rem;
  --radius-image: 1rem;
  --radius-pill: 999px;
  --shadow-toast: 0 6px 22px rgb(16 37 31 / 17%);
  --focus-ring: 0 0 0 2px var(--color-cream), 0 0 0 4px var(--color-orange);
  --ease-soft: cubic-bezier(0.2, 0.7, 0.2, 1);
}
```

### Design tokens JSON

```json
{
  "brand": "Velure Loop",
  "colors": {
    "forest": "#0F4C3A",
    "cream": "#FBF1E4",
    "peach": "#F9DFC0",
    "accent": "#FF5A00",
    "accentStrong": "#C94700",
    "sage": "#DCE8D8",
    "ink": "#23372E",
    "muted": "#66736B",
    "border": "#DDD4C7"
  },
  "fonts": {
    "display": ["Cormorant Garamond", "Playfair Display", "Georgia", "serif"],
    "body": ["DM Sans", "Inter", "Arial", "sans-serif"]
  },
  "breakpoints": {
    "mobileMax": "600px",
    "tabletMax": "820px",
    "wideMin": "1500px"
  },
  "radii": { "card": "20px", "image": "16px", "pill": "999px" },
  "spacingBase": "4px",
  "motion": {
    "controlMs": 200,
    "imageMs": 320,
    "easing": "cubic-bezier(.2,.7,.2,1)"
  }
}
```

## 14. Untuk RuangLagi: tiru sekitar 60%

Target: RuangLagi terasa satu keluarga dengan Velure Loop, **bukan salinan**. RuangLagi tetap punya identitas sendiri.

| Ditiru dari Velure Loop                                                         | Dibiarkan seperti RuangLagi                                           |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Palet forest, cream, peach, sage                                                | Struktur halaman, route, API, logika bisnis (Prisma, Auth)            |
| Oranye hemat: CTA, diskon, fokus aktif                                          | Nama brand, copy, dan konten                                          |
| Heading serif elegan dengan letter-spacing rapat                                | DM Sans untuk body (sudah sama)                                       |
| Radius besar, tombol dan chip pill, frame produk peach                          | Komponen shadcn/Radix dan perilaku form, filter, pagination, wishlist |
| Hover tenang 160-240ms, easing lembut                                           | Aset dan foto milik RuangLagi                                         |
| Teks minimal 12px, target 44px, focus-visible                                   |                                                                       |
| Ritme section cream dan hijau, whitespace lapang                                |                                                                       |
| Maksimal 2 dekorasi ringan (asterisk watermark, teks besar terpotong di footer) |                                                                       |

**Jangan disalin:** nama "Velure", wordmark, copy, tagline, dan aset Velure Loop.

**Wajib diikuti (Must)**

- [ ] Semua nilai lewat token; tidak menambah warna literal di komponen.
- [ ] Orange hanya untuk CTA, diskon, fokus aktif; kontras tombol oranye lolos AA.
- [ ] Teks informatif >= 12px; target sentuh >= 44px.
- [ ] `:focus-visible`, `aria-*`, dan `prefers-reduced-motion` tersedia.
- [ ] Logika bisnis, route, API, skema data tidak berubah.

**Boleh disesuaikan (Flexible)**

- [ ] Font heading boleh DM Serif Display, Cormorant Garamond, atau Fraunces selama hierarkinya terjaga.
- [ ] Aksen oranye boleh tetap `#f07824` jika diputuskan sengaja, asalkan kontrasnya dicek.
- [ ] Gaya arch pada hero boleh diganti bentuk gambar lain.
- [ ] Jarak antar-section boleh berubah +-8px mengikuti konten.
- [ ] Posisi asterisk dan dekorasi boleh dipindah selama tidak mengganggu keterbacaan.
