# AuraHR — Multi-Role HRMS Admin Panel (Light Glassmorphism UI)

Proyek Tugas Mandiri **Pemrograman Web 2 (Client-Side Programming)** — Antarmuka *Human Resource Management System* (**HRMS**) bergaya **Modern Enterprise Light Glassmorphism** dengan arsitektur **3 Role Terintegrasi** (*Super Admin*, *HR Management*, dan *Portal Mandiri Karyawan / ESS*).

## Tautan Proyek & Dokumentasi
- **Live Website (GitHub Pages):** https://nandangadriansyah18.github.io/aurahr-hrms-admin/
- **Repository GitHub:** https://github.com/nandangadriansyah18/aurahr-hrms-admin
- **Dokumentasi Perancangan (ERD, User Flow, & Screenshot):** [`docs/perancangan.md`](./docs/perancangan.md)
- **Figma Design System & Hi-Fi UI (Publik):** [Buka Project Figma AuraHR](https://www.figma.com/design/ngTkoDdRVBud5g1gNqT7WU/AuraHR---Multi-Role-HRMS-Admin-Panel?node-id=1-2)
- **Google Stitch Exploration:** [Buka Project Stitch](https://stitch.google.com/projects/9802515967131939644)

---

## Fitur Utama Lintas Role
1. **Portal Login & Proteksi Rute RBAC (`index.html`)**
   - Autentikasi Email/NIP & kata sandi dengan validasi *real-time* serta *1-Klik Akun Demo*.
   - Pengalihan dan pembatasan halaman otomatis berdasarkan *role* pengguna aktif.
2. **HR Management (`dashboard.html`, `data-master.html`, `form.html`, `laporan.html`)**
   - **Dashboard SDM:** 4 KPI *real-time*, 2 grafik interaktif **Chart.js** (*Tren Kehadiran* & *Distribusi Departemen*), *Approval* pengajuan cuti karyawan, & log presensi masuk/keluar harian.
   - **Data Master Karyawan:** *Live search*, filter departemen & status kontrak, *pagination*, *Glass Detail Modal*, konfirmasi hapus, dan **Export CSV**.
   - **Form Tambah/Edit Pegawai:** Validasi JS *real-time*, kalkulasi otomatis bruto & *Take Home Pay*, serta pembuatan akun portal ESS otomatis untuk pegawai baru.
   - **Laporan & Rekapitulasi:** Rekap per departemen & per pegawai, **Export CSV**, blok pengesahan digital, dan cetak **A4 Landscape (`window.print()`)**.
3. **Portal Mandiri Karyawan / ESS (`portal-karyawan.html`)**
   - **Beranda & Presensi:** Jam digital WIB *real-time*, tombol *Check-In / Check-Out*, KPI sisa kuota cuti & kehadiran bulanan yang tersinkron otomatis, serta riwayat presensi.
   - **Pengajuan Cuti & Izin:** Formulir pengajuan cuti yang langsung masuk ke antrean *Approval* Dashboard HR.
   - **E-Slip Gaji Digital:** Modal rincian gaji resmi siap cetak.
4. **Super Admin Governance (`manajemen-role.html`)**
   - Pengelolaan akun pengguna (*Ubah Role*, *Aktif/Nonaktif Akun*, *Reset Sandi*, *Hapus Akun*) dengan validasi anti-duplikat NIP & Email.
   - Pengelolaan *Master Departemen* (tambah divisi baru, edit kuota formasi, & hapus divisi kosong).

---

## Struktur Direktori Proyek
```text
├── docs/
│   └── perancangan.md          # Milestone 1: Hirarki Menu, ERD, User Flow, Link & Screenshot Stitch/Figma
├── assets/
│   ├── css/
│   │   └── style.css           # Design Tokens (:root), Glassmorphism UI, Responsive Grid/Flexbox, @media print
│   ├── js/
│   │   ├── store.js            # Client-Side Data Store (localStorage + SEED_DATA Multi-Role)
│   │   └── app.js              # Shared Shell (Sidebar Toggle, RBAC Guard, Global Search Ctrl+K, Modal & Toast)
│   └── img/                    # Dokumentasi visual eksplorasi Stitch & Figma
├── pages/
│   ├── dashboard.html          # Dashboard SDM (KPI, Chart.js, Approval Cuti, Log Presensi)
│   ├── data-master.html        # Direktori Karyawan (Search, Filter, Pagination, CRUD, Export CSV)
│   ├── form.html               # Form Tambah/Edit Karyawan + Validasi JS Real-time
│   ├── laporan.html            # Laporan Kehadiran & Payroll + Export CSV + Cetak PDF/Print
│   ├── portal-karyawan.html    # Portal Mandiri Karyawan / ESS (Presensi, Cuti, E-Slip Gaji)
│   └── manajemen-role.html     # Governance Super Admin (RBAC Akun & Master Departemen)
├── layout.html                 # Milestone 2: Kerangka Dasar Responsif & Spesimen Komponen
└── index.html                  # Halaman Utama: Portal Login Multi-Role
```

---

## Akun Demo & Cara Menjalankan
| Role | Nama Pengguna | Email / NIP | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Arya Pratama, S.Kom | `arya.pratama@aurahr.id` (`AUR-0001`) | `password123` |
| **HR Management** | Siti Rahmawati, S.Psi | `siti.rahma@aurahr.id` (`AUR-0021`) | `password123` |
| **Karyawan (ESS)** | Budi Santoso, S.T. | `budi.santoso@aurahr.id` (`AUR-0108`) | `password123` |

- **Penyimpanan Data:** Menggunakan **`localStorage`** browser sehingga seluruh perubahan (CRUD pegawai, absensi, pengajuan cuti, dan pengaturan akun) langsung tersimpan secara persisten tanpa memerlukan *server back-end*.
- **Menjalankan Lokal:** Buka langsung `index.html` atau jalankan server statis lokal (`python -m http.server 5500`).
