<?php
/**
 * AuraHR Enterprise HRMS — PHP REST API Endpoint (MySQL <-> Client-Side Store)
 * Mendukung GET (muat seluruh state dari MySQL) dan POST (mutasi CRUD real-time).
 */
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function jsonOut(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function formatLastLogin(?string $dt): string {
    if (!$dt) return 'Belum pernah login';
    $ts = strtotime($dt);
    if ($ts === false) return $dt;
    return date('d M Y, H:i', $ts) . ' WIB';
}

function resolveDeptId(PDO $pdo, string $deptName): string {
    $stmt = $pdo->prepare('SELECT id_dept FROM departments WHERE nama_dept = ? OR id_dept = ? LIMIT 1');
    $stmt->execute([$deptName, $deptName]);
    $row = $stmt->fetch();
    if ($row) return $row['id_dept'];
    $fallback = $pdo->query('SELECT id_dept FROM departments LIMIT 1')->fetch();
    return $fallback ? $fallback['id_dept'] : 'ENG';
}

function resolvePositionId(PDO $pdo, string $posName, string $deptId, float $allowance): string {
    $stmt = $pdo->prepare('SELECT id_jabatan FROM positions WHERE nama_jabatan = ? LIMIT 1');
    $stmt->execute([$posName]);
    $row = $stmt->fetch();
    if ($row) return $row['id_jabatan'];

    $idJab = 'POS-' . strtoupper(substr(md5($posName . microtime()), 0, 6));
    $ins = $pdo->prepare('INSERT INTO positions (id_jabatan, id_dept, nama_jabatan, grade_level, tunjangan_jabatan) VALUES (?, ?, ?, ?, ?)');
    $ins->execute([$idJab, $deptId, $posName, 'Staff', $allowance]);
    return $idJab;
}

/**
 * Simpan foto selfie base64 menjadi file fisik .jpg di folder uploads/presensi/
 * sekaligus mengembalikan path relatifnya untuk disimpan ke database MySQL.
 */
function saveAttendancePhoto(?string $dataOrPath, string $attId, string $suffix): ?string {
    if (!$dataOrPath) return null;
    if (strpos($dataOrPath, 'data:image/') === 0) {
        $parts = explode(',', $dataOrPath, 2);
        if (count($parts) === 2) {
            $bin = base64_decode($parts[1], true);
            if ($bin !== false) {
                $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'presensi';
                if (!is_dir($dir)) {
                    @mkdir($dir, 0777, true);
                }
                $safeId = preg_replace('/[^A-Za-z0-9_-]/', '', $attId) ?: ('ATT-' . time());
                $filename = $safeId . '_' . $suffix . '.jpg';
                $fullPath = $dir . DIRECTORY_SEPARATOR . $filename;
                if (@file_put_contents($fullPath, $bin) !== false) {
                    return 'uploads/presensi/' . $filename;
                }
            }
        }
    }
    return $dataOrPath;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Auto-migrate kolom tambahan presensi (GPS, Catatan Harian, Foto Masuk & Foto Pulang) jika belum ada
try {
    $pdo->exec("ALTER TABLE attendances ADD COLUMN IF NOT EXISTS koordinat_gps VARCHAR(140) DEFAULT '-6.2249, 106.8096 • SCBD Jakarta (38m)'");
    $pdo->exec("ALTER TABLE attendances ADD COLUMN IF NOT EXISTS catatan_kerja VARCHAR(255) DEFAULT NULL");
    $pdo->exec("ALTER TABLE attendances ADD COLUMN IF NOT EXISTS foto_bukti LONGTEXT DEFAULT NULL");
    $pdo->exec("ALTER TABLE attendances ADD COLUMN IF NOT EXISTS foto_keluar LONGTEXT DEFAULT NULL");
} catch (Throwable $ignore) {
    // Abaikan jika sudah ada
}

if ($method === 'GET') {
    $depts = $pdo->query('SELECT id_dept AS id, kode_dept AS code, nama_dept AS name, kepala_divisi AS head, kuota_formasi AS quota FROM departments ORDER BY nama_dept ASC')->fetchAll();
    foreach ($depts as &$d) {
        $d['quota'] = (int)$d['quota'];
    }

    $empSql = "
        SELECT
            e.id_karyawan AS id,
            e.nip,
            e.nama_lengkap AS name,
            e.email,
            e.no_telepon AS phone,
            e.jenis_kelamin AS gender,
            d.nama_dept AS dept,
            p.nama_jabatan AS position,
            e.status_kontrak AS contract,
            e.status_aktif AS active,
            e.tanggal_masuk AS joinDate,
            e.gaji_pokok AS baseSalary,
            e.tunjangan AS allowance
        FROM employees e
        LEFT JOIN departments d ON e.id_dept = d.id_dept
        LEFT JOIN positions p ON e.id_jabatan = p.id_jabatan
        ORDER BY e.created_at DESC, e.nip ASC
    ";
    $employees = $pdo->query($empSql)->fetchAll();
    foreach ($employees as &$e) {
        $e['active'] = ((int)$e['active']) === 1;
        $e['baseSalary'] = (float)$e['baseSalary'];
        $e['allowance'] = (float)$e['allowance'];
        $e['attendanceRate'] = 96;
    }

    $leaveSql = "
        SELECT
            l.id_cuti AS id,
            e.nip,
            e.nama_lengkap AS employeeName,
            d.nama_dept AS dept,
            l.jenis_cuti AS type,
            l.tgl_mulai AS startDate,
            l.tgl_selesai AS endDate,
            l.jumlah_hari AS days,
            l.alasan AS reason,
            l.status_approval AS status
        FROM leave_requests l
        JOIN employees e ON l.id_karyawan = e.id_karyawan
        LEFT JOIN departments d ON e.id_dept = d.id_dept
        ORDER BY l.created_at DESC, l.id_cuti DESC
    ";
    $leaveRequests = $pdo->query($leaveSql)->fetchAll();
    foreach ($leaveRequests as &$l) {
        $l['days'] = (int)$l['days'];
    }

    $attSql = "
        SELECT
            a.id_absensi AS id,
            e.nip,
            e.nama_lengkap AS employeeName,
            d.nama_dept AS dept,
            a.tanggal AS date,
            a.jam_masuk AS checkInRaw,
            a.jam_keluar AS checkOutRaw,
            a.mode_kerja AS mode,
            a.status_hadir AS status,
            a.koordinat_gps AS gps,
            a.catatan_kerja AS note,
            a.foto_bukti AS photo,
            a.foto_keluar AS photoOut
        FROM attendances a
        JOIN employees e ON a.id_karyawan = e.id_karyawan
        LEFT JOIN departments d ON e.id_dept = d.id_dept
        ORDER BY a.tanggal DESC, a.jam_masuk DESC
    ";
    $attRows = $pdo->query($attSql)->fetchAll();
    $essAttendances = array_map(static function ($a) {
        return [
            'id'           => $a['id'],
            'nip'          => $a['nip'],
            'employeeName' => $a['employeeName'],
            'dept'         => $a['dept'] ?? '-',
            'date'         => $a['date'],
            'checkIn'      => $a['checkInRaw'] ? ($a['checkInRaw'] . ' WIB') : null,
            'checkOut'     => $a['checkOutRaw'] ? ($a['checkOutRaw'] . ' WIB') : null,
            'mode'         => $a['mode'],
            'status'       => $a['status'],
            'gps'          => $a['gps'] ?: '-6.2249, 106.8096 • SCBD Jakarta (38m)',
            'note'         => $a['note'] ?: '',
            'photo'        => $a['photo'] ?: null,
            'photoOut'     => $a['photoOut'] ?: null,
        ];
    }, $attRows);

    $accSql = "
        SELECT
            u.id_user AS id,
            u.nip,
            COALESCE(e.nama_lengkap, u.email_login) AS name,
            u.email_login AS email,
            u.password_hash AS password,
            u.role_akses AS role,
            u.login_terakhir AS lastLoginRaw,
            u.status_akun AS active
        FROM user_accounts u
        LEFT JOIN employees e ON u.id_karyawan = e.id_karyawan
        ORDER BY u.id_user ASC
    ";
    $accRows = $pdo->query($accSql)->fetchAll();
    $accounts = array_map(static function ($u) {
        return [
            'id'        => $u['id'],
            'nip'       => $u['nip'],
            'name'      => $u['name'],
            'email'     => $u['email'],
            'password'  => $u['password'],
            'role'      => $u['role'],
            'lastLogin' => formatLastLogin($u['lastLoginRaw']),
            'active'    => ((int)$u['active']) === 1,
        ];
    }, $accRows);

    jsonOut([
        'ok' => true,
        'db' => [
            'departments'    => $depts,
            'employees'      => $employees,
            'leaveRequests'  => $leaveRequests,
            'essAttendances' => $essAttendances,
            'accounts'       => $accounts,
        ],
    ]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw ?: '{}', true);
    $action = $body['action'] ?? '';
    $p = $body['payload'] ?? [];

    try {
        switch ($action) {
            case 'saveEmployee': {
                $deptId = resolveDeptId($pdo, (string)($p['dept'] ?? 'ENG'));
                $posId = resolvePositionId($pdo, (string)($p['position'] ?? 'Staff'), $deptId, (float)($p['allowance'] ?? 0));
                $empId = (string)($p['id'] ?? '');
                $activeInt = !empty($p['active']) ? 1 : 0;

                $exists = false;
                if ($empId !== '') {
                    $chk = $pdo->prepare('SELECT id_karyawan FROM employees WHERE id_karyawan = ?');
                    $chk->execute([$empId]);
                    $exists = (bool)$chk->fetch();
                }

                if ($exists) {
                    $upd = $pdo->prepare('
                        UPDATE employees
                        SET nip = ?, nama_lengkap = ?, email = ?, no_telepon = ?, jenis_kelamin = ?,
                            tanggal_masuk = ?, status_kontrak = ?, status_aktif = ?, gaji_pokok = ?,
                            tunjangan = ?, id_dept = ?, id_jabatan = ?
                        WHERE id_karyawan = ?
                    ');
                    $upd->execute([
                        $p['nip'], $p['name'], $p['email'], $p['phone'] ?? '',
                        $p['gender'] ?? 'Laki-laki', $p['joinDate'], $p['contract'] ?? 'Tetap',
                        $activeInt, (float)$p['baseSalary'], (float)($p['allowance'] ?? 0),
                        $deptId, $posId, $empId
                    ]);
                } else {
                    if ($empId === '') $empId = 'EMP-' . strtoupper(substr(uniqid(), -6));
                    $ins = $pdo->prepare('
                        INSERT INTO employees
                        (id_karyawan, nip, nama_lengkap, email, no_telepon, jenis_kelamin, tanggal_masuk,
                         status_kontrak, status_aktif, gaji_pokok, tunjangan, id_dept, id_jabatan)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ');
                    $ins->execute([
                        $empId, $p['nip'], $p['name'], $p['email'], $p['phone'] ?? '',
                        $p['gender'] ?? 'Laki-laki', $p['joinDate'], $p['contract'] ?? 'Tetap',
                        $activeInt, (float)$p['baseSalary'], (float)($p['allowance'] ?? 0),
                        $deptId, $posId
                    ]);

                    // Auto-create ESS account if email/nip doesn't exist
                    $chkAcc = $pdo->prepare('SELECT id_user FROM user_accounts WHERE email_login = ? OR nip = ?');
                    $chkAcc->execute([$p['email'], $p['nip']]);
                    if (!$chkAcc->fetch()) {
                        $accId = 'ACC-' . strtoupper(substr(uniqid(), -5));
                        $insAcc = $pdo->prepare('INSERT INTO user_accounts (id_user, id_karyawan, nip, email_login, password_hash, role_akses, status_akun) VALUES (?, ?, ?, ?, ?, ?, ?)');
                        $insAcc->execute([$accId, $empId, $p['nip'], $p['email'], 'password123', 'KARYAWAN', $activeInt]);
                    }
                }
                jsonOut(['ok' => true, 'id' => $empId]);
            }

            case 'deleteEmployee': {
                $stmt = $pdo->prepare('DELETE FROM employees WHERE id_karyawan = ?');
                $stmt->execute([$p['id'] ?? '']);
                jsonOut(['ok' => true]);
            }

            case 'submitLeave': {
                $empStmt = $pdo->prepare('SELECT id_karyawan FROM employees WHERE nip = ? LIMIT 1');
                $empStmt->execute([$p['nip'] ?? '']);
                $emp = $empStmt->fetch();
                if (!$emp) jsonOut(['ok' => false, 'error' => 'Pegawai tidak ditemukan'], 404);

                $idCuti = (string)($p['id'] ?? ('LV-' . rand(100, 999)));
                $ins = $pdo->prepare('
                    INSERT INTO leave_requests (id_cuti, id_karyawan, jenis_cuti, tgl_mulai, tgl_selesai, jumlah_hari, alasan, status_approval)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ');
                $ins->execute([
                    $idCuti, $emp['id_karyawan'], $p['type'] ?? 'Cuti Tahunan',
                    $p['startDate'], $p['endDate'], (int)($p['days'] ?? 1),
                    $p['reason'] ?? '-', 'Pending'
                ]);
                jsonOut(['ok' => true, 'id' => $idCuti]);
            }

            case 'updateLeaveStatus': {
                $stmt = $pdo->prepare('UPDATE leave_requests SET status_approval = ? WHERE id_cuti = ?');
                $stmt->execute([$p['status'] ?? 'Pending', $p['id'] ?? '']);
                jsonOut(['ok' => true]);
            }

            case 'toggleCheckInOut': {
                $empStmt = $pdo->prepare('SELECT id_karyawan FROM employees WHERE nip = ? LIMIT 1');
                $empStmt->execute([$p['nip'] ?? '']);
                $emp = $empStmt->fetch();
                if (!$emp) jsonOut(['ok' => false, 'error' => 'Pegawai tidak ditemukan'], 404);

                $rec = $p['record'] ?? [];
                $attId = (string)($rec['id'] ?? ('ATT-' . rand(1000, 9999)));
                $checkInTime = str_replace(' WIB', '', (string)($rec['checkIn'] ?? date('H:i:s')));
                $checkOutTime = !empty($rec['checkOut']) ? str_replace(' WIB', '', (string)$rec['checkOut']) : null;

                if (($p['action'] ?? '') === 'checkout' && $attId !== '') {
                    $savedOutPhoto = saveAttendancePhoto($rec['photoOut'] ?? ($rec['photo'] ?? null), $attId, 'pulang');
                    $upd = $pdo->prepare('UPDATE attendances SET jam_keluar = ?, catatan_kerja = COALESCE(NULLIF(?, \'\'), catatan_kerja), foto_keluar = COALESCE(?, foto_keluar) WHERE id_absensi = ?');
                    $upd->execute([$checkOutTime, (string)($rec['note'] ?? ''), $savedOutPhoto, $attId]);
                    jsonOut(['ok' => true, 'photoOut' => $savedOutPhoto]);
                } else {
                    $savedInPhoto = saveAttendancePhoto($rec['photo'] ?? null, $attId, 'masuk');
                    $statusHadir = in_array(($rec['status'] ?? ''), ['Hadir Tepat Waktu', 'Terlambat', 'Izin', 'Alpha'], true)
                        ? $rec['status']
                        : 'Hadir Tepat Waktu';
                    $ins = $pdo->prepare('
                        INSERT INTO attendances (id_absensi, id_karyawan, tanggal, jam_masuk, jam_keluar, mode_kerja, status_hadir, koordinat_gps, catatan_kerja, foto_bukti)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ');
                    $ins->execute([
                        $attId,
                        $emp['id_karyawan'],
                        $rec['date'] ?? date('Y-m-d'),
                        $checkInTime,
                        $checkOutTime,
                        $rec['mode'] ?? 'WFO - Kantor Pusat Jakarta',
                        $statusHadir,
                        $rec['gps'] ?? '-6.2249, 106.8096 • SCBD Jakarta (38m)',
                        $rec['note'] ?? '',
                        $savedInPhoto
                    ]);
                    jsonOut(['ok' => true, 'photo' => $savedInPhoto]);
                }
            }

            case 'addAccount': {
                $empStmt = $pdo->prepare('SELECT id_karyawan FROM employees WHERE nip = ? OR email = ? LIMIT 1');
                $empStmt->execute([$p['nip'] ?? '', $p['email'] ?? '']);
                $emp = $empStmt->fetch();

                $ins = $pdo->prepare('
                    INSERT INTO user_accounts (id_user, id_karyawan, nip, email_login, password_hash, role_akses, status_akun)
                    VALUES (?, ?, ?, ?, ?, ?, 1)
                ');
                $ins->execute([
                    $p['id'],
                    $emp ? $emp['id_karyawan'] : null,
                    $p['nip'],
                    $p['email'],
                    $p['password'] ?? 'password123',
                    $p['role'] ?? 'KARYAWAN'
                ]);
                jsonOut(['ok' => true]);
            }

            case 'updateAccountRole': {
                $stmt = $pdo->prepare('UPDATE user_accounts SET role_akses = ? WHERE id_user = ?');
                $stmt->execute([$p['role'] ?? 'KARYAWAN', $p['id'] ?? '']);
                jsonOut(['ok' => true]);
            }

            case 'toggleAccountActive': {
                $stmt = $pdo->prepare('UPDATE user_accounts SET status_akun = ? WHERE id_user = ?');
                $stmt->execute([!empty($p['active']) ? 1 : 0, $p['id'] ?? '']);
                jsonOut(['ok' => true]);
            }

            case 'resetAccountPassword': {
                $stmt = $pdo->prepare('UPDATE user_accounts SET password_hash = ? WHERE id_user = ?');
                $stmt->execute([$p['password'] ?? 'password123', $p['id'] ?? '']);
                jsonOut(['ok' => true]);
            }

            case 'deleteAccount': {
                $stmt = $pdo->prepare('DELETE FROM user_accounts WHERE id_user = ?');
                $stmt->execute([$p['id'] ?? '']);
                jsonOut(['ok' => true]);
            }

            case 'updateLastLogin': {
                $stmt = $pdo->prepare('UPDATE user_accounts SET login_terakhir = NOW() WHERE id_user = ?');
                $stmt->execute([$p['id'] ?? '']);
                jsonOut(['ok' => true]);
            }

            case 'addDepartment': {
                $ins = $pdo->prepare('INSERT INTO departments (id_dept, kode_dept, nama_dept, kepala_divisi, kuota_formasi) VALUES (?, ?, ?, ?, ?)');
                $ins->execute([
                    $p['code'], $p['code'], $p['name'], $p['head'], (int)($p['quota'] ?? 10)
                ]);
                jsonOut(['ok' => true]);
            }

            case 'updateDepartmentQuota': {
                $stmt = $pdo->prepare('UPDATE departments SET kuota_formasi = ? WHERE id_dept = ?');
                $stmt->execute([(int)($p['quota'] ?? 10), $p['id'] ?? '']);
                jsonOut(['ok' => true]);
            }

            case 'deleteDepartment': {
                $stmt = $pdo->prepare('DELETE FROM departments WHERE id_dept = ?');
                $stmt->execute([$p['id'] ?? '']);
                jsonOut(['ok' => true]);
            }

            default:
                jsonOut(['ok' => false, 'error' => 'Action tidak dikenal: ' . $action], 400);
        }
    } catch (Throwable $e) {
        jsonOut(['ok' => false, 'error' => $e->getMessage()], 500);
    }
}

jsonOut(['ok' => false, 'error' => 'Method not allowed'], 405);
