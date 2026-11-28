-- ============================================================================
-- AuraHR Enterprise HRMS — Relational Database Schema & Seed Data (MySQL/MariaDB)
-- Sinkron 100% dengan ERD pada docs/perancangan.md & data awal assets/js/store.js
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `aurahr_hrms`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `aurahr_hrms`;

-- ----------------------------------------------------------------------------
-- 1. Tabel DEPARTMENTS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payrolls`;
DROP TABLE IF EXISTS `leave_requests`;
DROP TABLE IF EXISTS `attendances`;
DROP TABLE IF EXISTS `user_accounts`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `positions`;
DROP TABLE IF EXISTS `departments`;

CREATE TABLE `departments` (
  `id_dept` VARCHAR(10) NOT NULL,
  `kode_dept` VARCHAR(10) NOT NULL,
  `nama_dept` VARCHAR(100) NOT NULL,
  `kepala_divisi` VARCHAR(120) NOT NULL,
  `kuota_formasi` INT UNSIGNED NOT NULL DEFAULT 10,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_dept`),
  UNIQUE KEY `uk_kode_dept` (`kode_dept`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 2. Tabel POSITIONS
-- ----------------------------------------------------------------------------
CREATE TABLE `positions` (
  `id_jabatan` VARCHAR(16) NOT NULL,
  `id_dept` VARCHAR(10) NOT NULL,
  `nama_jabatan` VARCHAR(100) NOT NULL,
  `grade_level` VARCHAR(20) NOT NULL DEFAULT 'Mid-Level',
  `tunjangan_jabatan` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id_jabatan`),
  KEY `idx_pos_dept` (`id_dept`),
  CONSTRAINT `fk_pos_dept` FOREIGN KEY (`id_dept`) REFERENCES `departments` (`id_dept`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3. Tabel EMPLOYEES
-- ----------------------------------------------------------------------------
CREATE TABLE `employees` (
  `id_karyawan` VARCHAR(20) NOT NULL,
  `nip` VARCHAR(20) NOT NULL,
  `nama_lengkap` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) NOT NULL,
  `no_telepon` VARCHAR(30) DEFAULT NULL,
  `jenis_kelamin` ENUM('Laki-laki', 'Perempuan') NOT NULL DEFAULT 'Laki-laki',
  `tanggal_masuk` DATE NOT NULL,
  `status_kontrak` ENUM('Tetap', 'Kontrak', 'Probation', 'Nonaktif') NOT NULL DEFAULT 'Tetap',
  `status_aktif` TINYINT(1) NOT NULL DEFAULT 1,
  `gaji_pokok` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tunjangan` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `id_dept` VARCHAR(10) NOT NULL,
  `id_jabatan` VARCHAR(16) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_karyawan`),
  UNIQUE KEY `uk_emp_nip` (`nip`),
  UNIQUE KEY `uk_emp_email` (`email`),
  KEY `idx_emp_dept` (`id_dept`),
  KEY `idx_emp_pos` (`id_jabatan`),
  CONSTRAINT `fk_emp_dept` FOREIGN KEY (`id_dept`) REFERENCES `departments` (`id_dept`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_emp_pos` FOREIGN KEY (`id_jabatan`) REFERENCES `positions` (`id_jabatan`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 4. Tabel USER_ACCOUNTS (Multi-Role RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE `user_accounts` (
  `id_user` VARCHAR(20) NOT NULL,
  `id_karyawan` VARCHAR(20) DEFAULT NULL,
  `nip` VARCHAR(20) NOT NULL,
  `email_login` VARCHAR(120) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_akses` ENUM('SUPER_ADMIN', 'HR', 'KARYAWAN') NOT NULL DEFAULT 'KARYAWAN',
  `status_akun` TINYINT(1) NOT NULL DEFAULT 1,
  `login_terakhir` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `uk_user_email` (`email_login`),
  UNIQUE KEY `uk_user_nip` (`nip`),
  KEY `idx_user_emp` (`id_karyawan`),
  CONSTRAINT `fk_user_emp` FOREIGN KEY (`id_karyawan`) REFERENCES `employees` (`id_karyawan`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 5. Tabel ATTENDANCES (Presensi Harian)
-- ----------------------------------------------------------------------------
CREATE TABLE `attendances` (
  `id_absensi` VARCHAR(20) NOT NULL,
  `id_karyawan` VARCHAR(20) NOT NULL,
  `tanggal` DATE NOT NULL,
  `jam_masuk` TIME DEFAULT NULL,
  `jam_keluar` TIME DEFAULT NULL,
  `mode_kerja` VARCHAR(60) NOT NULL DEFAULT 'WFO - Kantor Pusat Jakarta',
  `status_hadir` ENUM('Hadir Tepat Waktu', 'Terlambat', 'Izin', 'Alpha') NOT NULL DEFAULT 'Hadir Tepat Waktu',
  `koordinat_gps` VARCHAR(140) DEFAULT '-6.2249, 106.8096 • SCBD Jakarta (38m)',
  `catatan_kerja` VARCHAR(255) DEFAULT NULL,
  `foto_bukti` LONGTEXT DEFAULT NULL,
  PRIMARY KEY (`id_absensi`),
  KEY `idx_att_emp` (`id_karyawan`),
  CONSTRAINT `fk_att_emp` FOREIGN KEY (`id_karyawan`) REFERENCES `employees` (`id_karyawan`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 6. Tabel LEAVE_REQUESTS (Pengajuan Cuti & Approval HR)
-- ----------------------------------------------------------------------------
CREATE TABLE `leave_requests` (
  `id_cuti` VARCHAR(20) NOT NULL,
  `id_karyawan` VARCHAR(20) NOT NULL,
  `jenis_cuti` ENUM('Cuti Tahunan', 'Izin Sakit', 'Cuti Khusus') NOT NULL DEFAULT 'Cuti Tahunan',
  `tgl_mulai` DATE NOT NULL,
  `tgl_selesai` DATE NOT NULL,
  `jumlah_hari` INT UNSIGNED NOT NULL DEFAULT 1,
  `alasan` TEXT NOT NULL,
  `status_approval` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cuti`),
  KEY `idx_leave_emp` (`id_karyawan`),
  CONSTRAINT `fk_leave_emp` FOREIGN KEY (`id_karyawan`) REFERENCES `employees` (`id_karyawan`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 7. Tabel PAYROLLS (Rekap Penggajian Bulanan)
-- ----------------------------------------------------------------------------
CREATE TABLE `payrolls` (
  `id_payroll` VARCHAR(20) NOT NULL,
  `id_karyawan` VARCHAR(20) NOT NULL,
  `periode_bulan` VARCHAR(20) NOT NULL,
  `gaji_pokok` DECIMAL(12,2) NOT NULL,
  `total_tunjangan` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `potongan` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `take_home_pay` DECIMAL(12,2) NOT NULL,
  `status_bayar` ENUM('Draft', 'Terverifikasi', 'Lunas') NOT NULL DEFAULT 'Lunas',
  PRIMARY KEY (`id_payroll`),
  KEY `idx_pay_emp` (`id_karyawan`),
  CONSTRAINT `fk_pay_emp` FOREIGN KEY (`id_karyawan`) REFERENCES `employees` (`id_karyawan`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 8. Tabel OTP_REQUESTS (Permintaan Reset Sandi via Super Admin & WhatsApp)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `otp_requests` (
  `id_otp` VARCHAR(24) NOT NULL,
  `id_user` VARCHAR(20) NOT NULL,
  `nip` VARCHAR(20) NOT NULL,
  `nama_user` VARCHAR(120) NOT NULL,
  `email_user` VARCHAR(120) NOT NULL,
  `no_wa` VARCHAR(30) NOT NULL,
  `kode_otp` VARCHAR(10) NOT NULL,
  `status_otp` ENUM('Pending', 'Sent', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_otp`),
  KEY `idx_otp_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 9. Tabel COMPANY_HOLIDAYS (Kalender Hari Libur & Pengumuman Super Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `company_holidays` (
  `id_libur` VARCHAR(24) NOT NULL,
  `judul` VARCHAR(140) NOT NULL,
  `tgl_mulai` DATE NOT NULL,
  `tgl_selesai` DATE NOT NULL,
  `kategori` ENUM('Libur Nasional', 'Cuti Bersama', 'Pengumuman Kantor') NOT NULL DEFAULT 'Libur Nasional',
  `keterangan` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_libur`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- SEED DATA AWAL PERUSAHAAN
-- ============================================================================

INSERT INTO `departments` (`id_dept`, `kode_dept`, `nama_dept`, `kepala_divisi`, `kuota_formasi`) VALUES
('ENG', 'ENG', 'Engineering & Product', 'Arya Pratama, S.Kom', 12),
('SLS', 'SLS', 'Sales & Marketing', 'Clarissa Tanuwijaya', 10),
('OPS', 'OPS', 'Operations & Logistik', 'Dimas Aditya Putra', 8),
('FIN', 'FIN', 'Finance & Legal', 'Linda Kusuma, C.A.', 6),
('HRD', 'HRD', 'HR & General Affairs', 'Siti Rahmawati, S.Psi', 6);

INSERT INTO `positions` (`id_jabatan`, `id_dept`, `nama_jabatan`, `grade_level`, `tunjangan_jabatan`) VALUES
('POS-CTO',  'ENG', 'Chief Technology Officer', 'Executive', 6500000.00),
('POS-SFE',  'ENG', 'Senior Frontend Engineer', 'Senior',    2500000.00),
('POS-UIUX', 'ENG', 'Lead UI/UX Designer',      'Lead',      2200000.00),
('POS-BE',   'ENG', 'Backend Engineer',         'Mid-Level', 2000000.00),
('POS-HRSP', 'HRD', 'Senior HR Specialist',     'Senior',    3000000.00),
('POS-POPS', 'HRD', 'People Operations Staff',  'Staff',     1700000.00),
('POS-DML',  'SLS', 'Digital Marketing Lead',   'Lead',      3200000.00),
('POS-AE',   'SLS', 'Account Executive',        'Mid-Level', 2000000.00),
('POS-FINL', 'FIN', 'Finance & Tax Lead',       'Lead',      3500000.00),
('POS-SFA',  'FIN', 'Senior Financial Analyst', 'Senior',    2300000.00),
('POS-SCC',  'OPS', 'Supply Chain Coordinator', 'Junior',    1500000.00),
('POS-FWS',  'OPS', 'Fleet & Warehouse Specialist', 'Staff', 1200000.00);

INSERT INTO `employees` (`id_karyawan`, `nip`, `nama_lengkap`, `email`, `no_telepon`, `jenis_kelamin`, `tanggal_masuk`, `status_kontrak`, `status_aktif`, `gaji_pokok`, `tunjangan`, `id_dept`, `id_jabatan`) VALUES
('EMP-001', 'AUR-0001', 'Arya Pratama, S.Kom',     'arya.pratama@aurahr.id',   '0812-8800-1001', 'Laki-laki', '2021-03-15', 'Tetap',     1, 28500000.00, 6500000.00, 'ENG', 'POS-CTO'),
('EMP-002', 'AUR-0021', 'Siti Rahmawati, S.Psi',   'siti.rahma@aurahr.id',     '0812-8800-1021', 'Perempuan', '2022-01-10', 'Tetap',     1, 14500000.00, 3000000.00, 'HRD', 'POS-HRSP'),
('EMP-003', 'AUR-0108', 'Budi Santoso, S.T.',      'budi.santoso@aurahr.id',   '0813-9100-0108', 'Laki-laki', '2022-06-12', 'Tetap',     1, 14000000.00, 2500000.00, 'ENG', 'POS-SFE'),
('EMP-004', 'AUR-0115', 'Nadia Kusuma Putri',      'nadia.putri@aurahr.id',    '0812-7744-0115', 'Perempuan', '2023-03-04', 'Tetap',     1, 13500000.00, 2200000.00, 'ENG', 'POS-UIUX'),
('EMP-005', 'AUR-0142', 'Rizky Pratama Wijaya',    'rizky.wijaya@aurahr.id',   '0857-2200-0142', 'Laki-laki', '2024-07-19', 'Kontrak',   1,  9500000.00, 2000000.00, 'SLS', 'POS-AE'),
('EMP-006', 'AUR-0156', 'Dewi Anggraini, S.H.',    'dewi.anggraini@aurahr.id', '0811-9400-0156', 'Perempuan', '2023-08-22', 'Tetap',     1,  9800000.00, 1700000.00, 'HRD', 'POS-POPS'),
('EMP-007', 'AUR-0189', 'Fajar Nugroho, S.E.',     'fajar.nugroho@aurahr.id',  '0812-6611-0189', 'Laki-laki', '2022-08-15', 'Tetap',     1, 12500000.00, 2300000.00, 'FIN', 'POS-SFA'),
('EMP-008', 'AUR-0210', 'Dimas Aditya Putra',      'dimas.putra@aurahr.id',    '0819-3300-0210', 'Laki-laki', '2026-09-01', 'Probation', 1,  8500000.00, 1500000.00, 'OPS', 'POS-SCC'),
('EMP-009', 'AUR-0234', 'Clarissa Tanuwijaya',     'clarissa.tan@aurahr.id',   '0812-5588-0234', 'Perempuan', '2021-11-10', 'Tetap',     1, 15000000.00, 3200000.00, 'SLS', 'POS-DML'),
('EMP-010', 'AUR-0267', 'Hendra Gunawan',          'hendra.gunawan@aurahr.id', '0813-4411-0267', 'Laki-laki', '2024-05-14', 'Kontrak',   1, 12000000.00, 2000000.00, 'ENG', 'POS-BE'),
('EMP-011', 'AUR-0288', 'Linda Kusuma, C.A.',      'linda.kusuma@aurahr.id',   '0811-3009-0288', 'Perempuan', '2021-09-01', 'Tetap',     1, 17500000.00, 3500000.00, 'FIN', 'POS-FINL'),
('EMP-012', 'AUR-0305', 'Bagas Mahendra',          'bagas.mahendra@aurahr.id', '0856-7712-0305', 'Laki-laki', '2023-02-10', 'Nonaktif',  0,  8200000.00, 1200000.00, 'OPS', 'POS-FWS');

-- Password default demo: password123 (disimpan sebagai contoh hash/demo)
INSERT INTO `user_accounts` (`id_user`, `id_karyawan`, `nip`, `email_login`, `password_hash`, `role_akses`, `status_akun`, `login_terakhir`) VALUES
('ACC-01', 'EMP-001', 'AUR-0001', 'arya.pratama@aurahr.id',   'password123', 'SUPER_ADMIN', 1, '2026-11-26 08:10:00'),
('ACC-02', 'EMP-002', 'AUR-0021', 'siti.rahma@aurahr.id',     'password123', 'HR',          1, '2026-11-26 07:58:00'),
('ACC-03', 'EMP-006', 'AUR-0156', 'dewi.anggraini@aurahr.id', 'password123', 'HR',          1, '2026-11-25 17:12:00'),
('ACC-04', 'EMP-003', 'AUR-0108', 'budi.santoso@aurahr.id',   'password123', 'KARYAWAN',    1, '2026-11-26 07:56:00'),
('ACC-05', 'EMP-004', 'AUR-0115', 'nadia.putri@aurahr.id',    'password123', 'KARYAWAN',    1, '2026-11-26 08:04:00'),
('ACC-06', 'EMP-012', 'AUR-0305', 'bagas.mahendra@aurahr.id', 'password123', 'KARYAWAN',    0, '2026-10-12 09:00:00');

INSERT INTO `attendances` (`id_absensi`, `id_karyawan`, `tanggal`, `jam_masuk`, `jam_keluar`, `mode_kerja`, `status_hadir`) VALUES
('ATT-01', 'EMP-003', '2026-11-26', '07:56:00', NULL,       'WFO - Kantor Pusat Jakarta', 'Hadir Tepat Waktu'),
('ATT-02', 'EMP-003', '2026-11-25', '07:52:00', '17:08:00', 'WFO - Kantor Pusat Jakarta', 'Hadir Tepat Waktu'),
('ATT-03', 'EMP-003', '2026-11-24', '08:00:00', '17:15:00', 'Hybrid / Remote',            'Hadir Tepat Waktu');

INSERT INTO `leave_requests` (`id_cuti`, `id_karyawan`, `jenis_cuti`, `tgl_mulai`, `tgl_selesai`, `jumlah_hari`, `alasan`, `status_approval`) VALUES
('LV-101', 'EMP-003', 'Cuti Tahunan', '2026-12-02', '2026-12-04', 3, 'Acara pernikahan adik kandung di Bandung',           'Pending'),
('LV-102', 'EMP-004', 'Izin Sakit',   '2026-11-28', '2026-11-29', 2, 'Kontrol kesehatan & surat rujukan dokter terlampir', 'Pending'),
('LV-103', 'EMP-005', 'Cuti Tahunan', '2026-12-10', '2026-12-11', 2, 'Keperluan administrasi keluarga',                    'Pending'),
('LV-100', 'EMP-003', 'Cuti Tahunan', '2026-10-14', '2026-10-16', 3, 'Liburan keluarga kuartal III',                       'Approved'),
('LV-099', 'EMP-007', 'Cuti Khusus',  '2026-11-04', '2026-11-05', 2, 'Pendampingan persalinan istri',                      'Approved');

INSERT INTO `payrolls` (`id_payroll`, `id_karyawan`, `periode_bulan`, `gaji_pokok`, `total_tunjangan`, `potongan`, `take_home_pay`, `status_bayar`) VALUES
('PAY-202611-001', 'EMP-001', 'November 2026', 28500000.00, 6500000.00, 1750000.00, 33250000.00, 'Lunas'),
('PAY-202611-002', 'EMP-002', 'November 2026', 14500000.00, 3000000.00,  875000.00, 16625000.00, 'Lunas'),
('PAY-202611-003', 'EMP-003', 'November 2026', 14000000.00, 2500000.00,  825000.00, 15675000.00, 'Lunas'),
('PAY-202611-004', 'EMP-004', 'November 2026', 13500000.00, 2200000.00,  785000.00, 14915000.00, 'Lunas'),
('PAY-202611-011', 'EMP-011', 'November 2026', 17500000.00, 3500000.00, 1050000.00, 19950000.00, 'Lunas');
