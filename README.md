# AuraHR — Multi-Role HRMS Admin Panel (Glassmorphism UI)

Proyek Tugas Mandiri **Pemrograman Web 2 (Client-Side Programming)** — Pengembangan Antarmuka *Human Resource Management System* (**HRMS**) berbasis **Modern Enterprise Light Glassmorphism** dengan arsitektur **3 Role Terintegrasi** (*Super Admin*, *HR Management*, dan *Portal Mandiri Karyawan / ESS*).

## Tautan Desain (Milestone 1)
- **Dokumentasi Perancangan Lengkap (ERD & User Flow Mermaid):** [`docs/perancangan.md`](./docs/perancangan.md)
- **Figma Design System & Hi-Fi UI (Publik):** [Buka Project Figma AuraHR](https://www.figma.com/design/ngTkoDdRVBud5g1gNqT7WU/AuraHR---Multi-Role-HRMS-Admin-Panel?node-id=1-2)
- **Google Stitch Exploration:** [Buka Project Stitch](https://stitch.google.com/projects/9802515967131939644)

## Struktur Direktori Proyek
```text
├── docs/
│   └── perancangan.md          # Milestone 1: Dokumentasi Menu, ERD, User Flow, Link & Screenshot Stitch/Figma
├── assets/
│   ├── css/
│   │   └── style.css           # Design Tokens (:root), Glassmorphism UI, Responsive Grid/Flexbox, @media print
│   ├── js/
│   │   ├── store.js            # Mock Database & localStorage Multi-Role State (CRUD, Cuti, Presensi, RBAC)
│   │   └── app.js              # Shared Shell (Sidebar Toggle, Role Switcher, Global Search Ctrl+K, Modal & Toast)
│   └── img/                    # Dokumentasi visual Stitch & Figma
├── pages/
│   ├── dashboard.html          # Halaman Wajib 1: KPI Cards, Chart.js (Line & Doughnut), & Tabel Approval Cuti
│   ├── data-master.html        # Halaman Wajib 2: Direktori Karyawan (Search, Filter, Pagination, Detail & Delete Modal)
│   ├── form.html               # Halaman Wajib 3: Form Tambah/Edit Karyawan + Validasi JS Real-time & Kalkulasi Gaji
│   ├── laporan.html            # Halaman Wajib 4: Rekap Kehadiran & Payroll + Export CSV + Cetak PDF/Print
│   ├── portal-karyawan.html    # Ekstra Role Karyawan (ESS): Jam Presensi Live, Slip Gaji, & Form Cuti -> Sync ke HR
│   └── manajemen-role.html     # Ekstra Role Super Admin: Manajemen Akun RBAC & Kuota Formasi Departemen
├── layout.html                 # Milestone 2: Halaman Master/Template Dasar Responsif & Spesimen Komponen
└── index.html                  # Halaman Utama: Portal Login Multi-Role + 1-Klik Akun Demo Cepat
```

## Akun Simulasi Multi-Role (1-Klik di Halaman Login)
| Role | Nama Pengguna | Email / NIP | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Arya Pratama, S.Kom | `arya.pratama@aurahr.id` (`AUR-0001`) | `password123` |
| **HR Management** | Siti Rahmawati, S.Psi | `siti.rahma@aurahr.id` (`AUR-0021`) | `password123` |
| **Karyawan (ESS)** | Budi Santoso, S.T. | `budi.santoso@aurahr.id` (`AUR-0108`) | `password123` |

## Cara Menjalankan
1. Buka langsung `index.html` di browser modern, atau jalankan server statis lokal (misal Live Server / `npx serve .`).
2. Siap di-deploy langsung ke **GitHub Pages** atau **Vercel** tanpa konfigurasi tambahan (*Zero Build Step*).
