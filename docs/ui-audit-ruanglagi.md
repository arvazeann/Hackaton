# Audit UI RuangLagi (temuan UI-01 sampai UI-10)

Hasil audit statis berbasis kode. Skor kesehatan UI: **78/100**.
Stack: Next.js App Router, Tailwind CSS 4, komponen React bergaya shadcn/Radix.
Audit ini belum diverifikasi di browser: kontras per kombinasi, overflow, dan viewport meta tetap perlu dicek saat runtime.

## Temuan

| ID    | Keparahan     | Kategori          | File:baris                                                                                    | Masalah                                                                                                       | Perbaikan yang disarankan                                                                                                                           |
| ----- | ------------- | ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-01 | Medium        | Design system     | `src/app/globals.css:6-36`; literal lain di `src/app/` dan `src/components/`                  | 50 warna literal unik; warna komponen bercampur dengan token global.                                          | Pindahkan warna berulang ke token semantik dan ganti nilai hard-coded secara bertahap.                                                              |
| UI-02 | Medium        | Aksesibilitas     | `src/components/layout/navbar.tsx:93`; `src/components/product/cards.tsx:25,187`              | Teks 10px/11px pada badge sulit dibaca.                                                                       | Naikkan teks penting menjadi minimal 12px; pertahankan label kecil hanya jika dekoratif.                                                            |
| UI-03 | Medium        | UX/filter         | `src/components/product/filter.tsx:7,50-71`                                                   | Slider harga memakai batas hingga `2_147_483_647`, tidak bermakna untuk kontrol visual.                       | Tentukan batas dari data/domain, atau pakai input untuk nilai besar dan slider untuk rentang praktis. Butuh angka bisnis yang benar: tanyakan dulu. |
| UI-04 | Medium        | Target sentuh     | `src/components/layout/navbar.tsx:19-20,66-73`; `src/components/product/pagination.tsx:26-27` | Beberapa kontrol berukuran 40x40px, di bawah 44x44px.                                                         | Perbesar target ikon dan pagination ke 44px atau tambah hit area.                                                                                   |
| UI-05 | Low           | Konsistensi gerak | `src/components/product/cards.tsx:71,85`; `src/components/ui/select.tsx:97`                   | Durasi transisi berbeda (150/200/300ms); sebagian tidak menetapkan durasi.                                    | Definisikan skala motion kecil (fast/base/slow) dan pakai konsisten.                                                                                |
| UI-06 | Low           | Token desain      | `src/app/globals.css:36,73-76`; banyak class TSX                                              | Radius global bercampur radius arbitrer (`1.1rem`, `1.5rem`, `2rem`, `2.5rem`).                               | Pertahankan 3-4 tingkat radius bernama dan petakan komponen utama ke sana.                                                                          |
| UI-07 | Low           | Responsive/UX     | `src/components/layout/navbar.tsx:35,64`                                                      | Navbar memakai flex wrap, no-wrap, dan item `shrink-0`; ruang bisa tertekan di layar sempit atau zoom tinggi. | Uji lebar 320px dan zoom 200%; sederhanakan susunan guest actions bila perlu.                                                                       |
| UI-08 | Low           | Aksesibilitas     | Beragam kontrol; contoh `src/components/product/pagination.tsx:26-27`                         | Ukuran target dan state focus berbeda antar komponen.                                                         | Audit dengan keyboard dan pointer; samakan target, focus ring, dan disabled state.                                                                  |
| UI-09 | Perlu browser | Verifikasi visual | Seluruh halaman                                                                               | Kontras WCAG dan tampilan browser belum diverifikasi oleh audit statis.                                       | Jalankan pemeriksaan kontras pada pasangan warna hasil render dan uji semua state di browser. **Jangan ditebak oleh agent.**                        |
| UI-10 | Perlu browser | Responsive        | Seluruh halaman                                                                               | Viewport meta dan overflow aktual tidak dapat dipastikan dari TSX.                                            | Periksa halaman render pada mobile/tablet/desktop dan zoom. **Jangan ditebak oleh agent.**                                                          |

## Patch contoh (belum diterapkan)

**UI-03 — batasi slider ke rentang praktis** (angka final harus dari rentang harga produk nyata):

```diff
- const SLIDER_MAX_PRICE = 2_147_483_647;
+ const SLIDER_MAX_PRICE = 10_000_000;
```

**UI-04 — perbesar target pagination**:

```diff
 const pageLinkBase =
-  "grid size-10 place-items-center rounded-full border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus";
+  "grid size-11 place-items-center rounded-full border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus";
```

## Rencana perbaikan

**Quick wins (<30 menit)**

- Naikkan teks badge 10-11px yang membawa informasi menjadi minimal 12px (UI-02).
- Samakan target ikon navbar dan pagination menjadi minimal 44x44px (UI-04).
- Pastikan sort dapat diterapkan lewat keyboard dengan submit yang jelas.

**Medium (1-3 jam)**

- Tentukan batas slider dari rentang harga produk (UI-03).
- Buat inventaris token warna dan radius; migrasikan warna berulang (UI-01, UI-06).
- Seragamkan skala motion (UI-05).
- Uji `sm`, `md`, `lg`, lebar 320px, dan zoom 200% (UI-07, UI-10).

**Large (refactor)**

- Bentuk design tokens semantik untuk warna, radius, spacing, shadow, dan motion.
- Satukan pola button/link/icon-button beserta state focus dan disabled (UI-08).
- Jalankan audit aksesibilitas di browser untuk seluruh halaman (UI-09).

## Hal yang sudah baik (jangan dirusak)

- Pencarian, sort, filter, pagination, wishlist, dan form terhubung ke data atau route.
- Skip link, landmark semantik, `aria-pressed`, `aria-current`, label form, dan `prefers-reduced-motion` sudah ada.
- `next/image` dipakai dengan `sizes` pada kartu produk.
