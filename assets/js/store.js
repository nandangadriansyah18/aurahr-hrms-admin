/**
 * AuraHR — Multi-Role HRMS Client-Side Data Store (localStorage Persistence)
 * Supports 3 Connected Roles: SUPER_ADMIN, HR, and KARYAWAN (ESS)
 */
(function (window) {
  'use strict';

  const STORAGE_KEY = 'aurahr_hrms_db_v1';
  const SESSION_KEY = 'aurahr_active_session_v1';

  function getApiUrl() {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    if (proto !== 'http:' && proto !== 'https:') return null;
    if (host.endsWith('github.io') || host.endsWith('vercel.app')) return null;
    const path = window.location.pathname.replace(/\\/g, '/');
    return path.includes('/pages/') ? '../api/sync.php' : './api/sync.php';
  }

  let remoteEnabled = false;
  let memoryCache = null;

  function fetchInitialFromPhp() {
    const url = getApiUrl();
    if (!url) return null;
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url + '?t=' + Date.now(), false);
      xhr.send(null);
      if (xhr.status === 200 && xhr.getResponseHeader('Content-Type')?.includes('application/json')) {
        const res = JSON.parse(xhr.responseText);
        if (res && res.ok && res.db) {
          remoteEnabled = true;
          return res.db;
        }
      }
    } catch (e) { /* Fallback to localStorage */ }
    return null;
  }

  function pushToPhp(action, payload) {
    if (!remoteEnabled) return;
    const url = getApiUrl();
    if (!url) return;
    try {
      const bodyStr = JSON.stringify({ action, payload });
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: bodyStr.length < 55000
      }).catch(() => {});
    } catch (e) { /* ignore */ }
  }

  const SEED_DATA = {
    departments: [
      { id: 'ENG', code: 'ENG', name: 'Engineering & Product', head: 'Arya Pratama, S.Kom', quota: 12 },
      { id: 'SLS', code: 'SLS', name: 'Sales & Marketing', head: 'Clarissa Tanuwijaya', quota: 10 },
      { id: 'OPS', code: 'OPS', name: 'Operations & Logistik', head: 'Dimas Aditya Putra', quota: 8 },
      { id: 'FIN', code: 'FIN', name: 'Finance & Legal', head: 'Linda Kusuma, C.A.', quota: 6 },
      { id: 'HRD', code: 'HRD', name: 'HR & General Affairs', head: 'Siti Rahmawati, S.Psi', quota: 6 }
    ],
    employees: [
      {
        id: 'EMP-001', nip: 'AUR-0001', name: 'Arya Pratama, S.Kom', email: 'arya.pratama@aurahr.id',
        phone: '0812-8800-1001', gender: 'Laki-laki', dept: 'Engineering & Product', position: 'Chief Technology Officer',
        contract: 'Tetap', active: true, joinDate: '2021-03-15', baseSalary: 28500000, allowance: 6500000, attendanceRate: 98
      },
      {
        id: 'EMP-002', nip: 'AUR-0021', name: 'Siti Rahmawati, S.Psi', email: 'siti.rahma@aurahr.id',
        phone: '0812-8800-1021', gender: 'Perempuan', dept: 'HR & General Affairs', position: 'Senior HR Specialist',
        contract: 'Tetap', active: true, joinDate: '2022-01-10', baseSalary: 14500000, allowance: 3000000, attendanceRate: 97
      },
      {
        id: 'EMP-003', nip: 'AUR-0108', name: 'Budi Santoso, S.T.', email: 'budi.santoso@aurahr.id',
        phone: '0813-9100-0108', gender: 'Laki-laki', dept: 'Engineering & Product', position: 'Senior Frontend Engineer',
        contract: 'Tetap', active: true, joinDate: '2022-06-12', baseSalary: 14000000, allowance: 2500000, attendanceRate: 100
      },
      {
        id: 'EMP-004', nip: 'AUR-0115', name: 'Nadia Kusuma Putri', email: 'nadia.putri@aurahr.id',
        phone: '0812-7744-0115', gender: 'Perempuan', dept: 'Engineering & Product', position: 'Lead UI/UX Designer',
        contract: 'Tetap', active: true, joinDate: '2023-03-04', baseSalary: 13500000, allowance: 2200000, attendanceRate: 96
      },
      {
        id: 'EMP-005', nip: 'AUR-0142', name: 'Rizky Pratama Wijaya', email: 'rizky.wijaya@aurahr.id',
        phone: '0857-2200-0142', gender: 'Laki-laki', dept: 'Sales & Marketing', position: 'Account Executive',
        contract: 'Kontrak', active: true, joinDate: '2024-07-19', baseSalary: 9500000, allowance: 2000000, attendanceRate: 93
      },
      {
        id: 'EMP-006', nip: 'AUR-0156', name: 'Dewi Anggraini, S.H.', email: 'dewi.anggraini@aurahr.id',
        phone: '0811-9400-0156', gender: 'Perempuan', dept: 'HR & General Affairs', position: 'People Operations Staff',
        contract: 'Tetap', active: true, joinDate: '2023-08-22', baseSalary: 9800000, allowance: 1700000, attendanceRate: 95
      },
      {
        id: 'EMP-007', nip: 'AUR-0189', name: 'Fajar Nugroho, S.E.', email: 'fajar.nugroho@aurahr.id',
        phone: '0812-6611-0189', gender: 'Laki-laki', dept: 'Finance & Legal', position: 'Senior Financial Analyst',
        contract: 'Tetap', active: true, joinDate: '2022-08-15', baseSalary: 12500000, allowance: 2300000, attendanceRate: 97
      },
      {
        id: 'EMP-008', nip: 'AUR-0210', name: 'Dimas Aditya Putra', email: 'dimas.putra@aurahr.id',
        phone: '0819-3300-0210', gender: 'Laki-laki', dept: 'Operations & Logistik', position: 'Supply Chain Coordinator',
        contract: 'Probation', active: true, joinDate: '2026-09-01', baseSalary: 8500000, allowance: 1500000, attendanceRate: 92
      },
      {
        id: 'EMP-009', nip: 'AUR-0234', name: 'Clarissa Tanuwijaya', email: 'clarissa.tan@aurahr.id',
        phone: '0812-5588-0234', gender: 'Perempuan', dept: 'Sales & Marketing', position: 'Digital Marketing Lead',
        contract: 'Tetap', active: true, joinDate: '2021-11-10', baseSalary: 15000000, allowance: 3200000, attendanceRate: 96
      },
      {
        id: 'EMP-010', nip: 'AUR-0267', name: 'Hendra Gunawan', email: 'hendra.gunawan@aurahr.id',
        phone: '0813-4411-0267', gender: 'Laki-laki', dept: 'Engineering & Product', position: 'Backend Engineer',
        contract: 'Kontrak', active: true, joinDate: '2024-05-14', baseSalary: 12000000, allowance: 2000000, attendanceRate: 94
      },
      {
        id: 'EMP-011', nip: 'AUR-0288', name: 'Linda Kusuma, C.A.', email: 'linda.kusuma@aurahr.id',
        phone: '0811-3009-0288', gender: 'Perempuan', dept: 'Finance & Legal', position: 'Finance & Tax Lead',
        contract: 'Tetap', active: true, joinDate: '2021-09-01', baseSalary: 17500000, allowance: 3500000, attendanceRate: 99
      },
      {
        id: 'EMP-012', nip: 'AUR-0305', name: 'Bagas Mahendra', email: 'bagas.mahendra@aurahr.id',
        phone: '0856-7712-0305', gender: 'Laki-laki', dept: 'Operations & Logistik', position: 'Fleet & Warehouse Specialist',
        contract: 'Nonaktif', active: false, joinDate: '2023-02-10', baseSalary: 8200000, allowance: 1200000, attendanceRate: 85
      }
    ],
    leaveRequests: [
      {
        id: 'LV-101', nip: 'AUR-0108', employeeName: 'Budi Santoso, S.T.', dept: 'Engineering & Product',
        type: 'Cuti Tahunan', startDate: '2026-12-02', endDate: '2026-12-04', days: 3,
        reason: 'Acara pernikahan adik kandung di Bandung', status: 'Pending'
      },
      {
        id: 'LV-102', nip: 'AUR-0115', employeeName: 'Nadia Kusuma Putri', dept: 'Engineering & Product',
        type: 'Izin Sakit', startDate: '2026-11-28', endDate: '2026-11-29', days: 2,
        reason: 'Kontrol kesehatan & surat rujukan dokter terlampir', status: 'Pending'
      },
      {
        id: 'LV-103', nip: 'AUR-0142', employeeName: 'Rizky Pratama Wijaya', dept: 'Sales & Marketing',
        type: 'Cuti Tahunan', startDate: '2026-12-10', endDate: '2026-12-11', days: 2,
        reason: 'Keperluan administrasi keluarga', status: 'Pending'
      },
      {
        id: 'LV-100', nip: 'AUR-0108', employeeName: 'Budi Santoso, S.T.', dept: 'Engineering & Product',
        type: 'Cuti Tahunan', startDate: '2026-10-14', endDate: '2026-10-16', days: 3,
        reason: 'Liburan keluarga kuartal III', status: 'Approved'
      },
      {
        id: 'LV-099', nip: 'AUR-0189', employeeName: 'Fajar Nugroho, S.E.', dept: 'Finance & Legal',
        type: 'Cuti Khusus', startDate: '2026-11-04', endDate: '2026-11-05', days: 2,
        reason: 'Pendampingan persalinan istri', status: 'Approved'
      }
    ],
    essAttendances: [
      { id: 'ATT-01', nip: 'AUR-0108', date: '2026-11-26', checkIn: '07:56:12 WIB', checkOut: null, mode: 'WFO - Kantor Pusat Jakarta', status: 'Hadir Tepat Waktu', gps: '-6.2249, 106.8096 • SCBD Jakarta (34m)', note: 'Integrasi modul dashboard & API presensi' },
      { id: 'ATT-02', nip: 'AUR-0108', date: '2026-11-25', checkIn: '07:52:00 WIB', checkOut: '17:08:00 WIB', mode: 'WFO - Kantor Pusat Jakarta', status: 'Hadir Tepat Waktu', gps: '-6.2249, 106.8096 • SCBD Jakarta (41m)', note: 'Optimasi komponen tabel Data Master' },
      { id: 'ATT-03', nip: 'AUR-0108', date: '2026-11-24', checkIn: '08:00:00 WIB', checkOut: '17:15:00 WIB', mode: 'Hybrid / Work From Home', status: 'Hadir Tepat Waktu', gps: '-6.2741, 106.7382 • Bintaro (Remote GPS)', note: 'Code review & sinkronisasi desain UI' }
    ],
    accounts: [
      { id: 'ACC-01', nip: 'AUR-0001', name: 'Arya Pratama, S.Kom', email: 'arya.pratama@aurahr.id', password: 'password123', role: 'SUPER_ADMIN', lastLogin: 'Hari ini, 08:10 WIB', active: true },
      { id: 'ACC-02', nip: 'AUR-0021', name: 'Siti Rahmawati, S.Psi', email: 'siti.rahma@aurahr.id', password: 'password123', role: 'HR', lastLogin: 'Hari ini, 07:58 WIB', active: true },
      { id: 'ACC-03', nip: 'AUR-0156', name: 'Dewi Anggraini, S.H.', email: 'dewi.anggraini@aurahr.id', password: 'password123', role: 'HR', lastLogin: 'Kemarin, 17:12 WIB', active: true },
      { id: 'ACC-04', nip: 'AUR-0108', name: 'Budi Santoso, S.T.', email: 'budi.santoso@aurahr.id', password: 'password123', role: 'KARYAWAN', lastLogin: 'Hari ini, 07:56 WIB', active: true },
      { id: 'ACC-05', nip: 'AUR-0115', name: 'Nadia Kusuma Putri', email: 'nadia.putri@aurahr.id', password: 'password123', role: 'KARYAWAN', lastLogin: 'Hari ini, 08:04 WIB', active: true },
      { id: 'ACC-06', nip: 'AUR-0288', name: 'Bagas Mahendra', email: 'bagas.mahendra@aurahr.id', password: 'password123', role: 'KARYAWAN', lastLogin: '12 Okt 2026', active: false }
    ]
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function formatLocalIsoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function loadDB() {
    if (memoryCache) return memoryCache;

    const remoteDb = fetchInitialFromPhp();
    if (remoteDb) {
      memoryCache = remoteDb;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteDb)); } catch (e) { /* ignore */ }
      return memoryCache;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = clone(SEED_DATA);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        memoryCache = initial;
        return memoryCache;
      }
      const parsed = JSON.parse(raw);
      let repaired = false;
      if (Array.isArray(parsed.employees)) {
        parsed.employees.forEach((e, idx) => {
          if (!e.id) {
            e.id = 'EMP-FIX-' + String(e.nip || idx).replace(/\W+/g, '');
            repaired = true;
          }
        });
      }
      memoryCache = parsed;
      if (repaired) saveDB(parsed);
      return memoryCache;
    } catch (e) {
      memoryCache = clone(SEED_DATA);
      return memoryCache;
    }
  }

  function saveDB(db) {
    memoryCache = db;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  const AuraStore = {
    getDB() {
      return loadDB();
    },

    resetDemoData() {
      const fresh = clone(SEED_DATA);
      saveDB(fresh);
      return fresh;
    },

    /* ---------------- AUTH & MULTI-ROLE SESSION ---------------- */
    getSession() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) { /* ignore */ }
      return null;
    },

    login(identifier, password) {
      const db = loadDB();
      const q = (identifier || '').trim().toLowerCase();
      const acc = db.accounts.find(a =>
        a.email.toLowerCase() === q ||
        a.nip.toLowerCase() === q ||
        a.name.toLowerCase() === q
      );

      if (!acc) {
        return { ok: false, message: 'Email atau NIP tidak terdaftar dalam sistem.' };
      }
      if (!acc.active) {
        return { ok: false, message: 'Akun Anda sedang dinonaktifkan oleh Super Admin.' };
      }
      if (!password || acc.password !== password) {
        return { ok: false, message: 'Kata sandi yang Anda masukkan salah.' };
      }

      const emp = db.employees.find(e => e.nip === acc.nip);
      const session = {
        id: acc.id,
        nip: acc.nip,
        name: acc.name,
        email: acc.email,
        role: acc.role,
        title: emp ? emp.position : (acc.role === 'SUPER_ADMIN' ? 'System Administrator' : 'Staff')
      };
      acc.lastLogin = 'Baru saja';
      saveDB(db);
      pushToPhp('updateLastLogin', { id: acc.id });
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { ok: true, session };
    },

    switchRoleQuick(role) {
      const db = loadDB();
      const acc = db.accounts.find(a => a.role === role && a.active) || db.accounts[0];
      const emp = db.employees.find(e => e.nip === acc.nip);
      const session = {
        id: acc.id,
        nip: acc.nip,
        name: acc.name,
        email: acc.email,
        role: acc.role,
        title: emp ? emp.position : acc.role
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    },

    logout() {
      localStorage.removeItem(SESSION_KEY);
    },

    /* ---------------- EMPLOYEES CRUD ---------------- */
    getEmployees() {
      return loadDB().employees;
    },

    getEmployeeById(id) {
      return loadDB().employees.find(e => e.id === id) || null;
    },

    generateNextNip() {
      const db = loadDB();
      let maxNum = 305;
      [...db.employees, ...db.accounts].forEach(item => {
        const m = String(item.nip || '').match(/(\d+)/);
        if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
      });
      return 'AUR-' + String(maxNum + 1).padStart(4, '0');
    },

    saveEmployee(payload) {
      const db = loadDB();
      if (payload.id) {
        const idx = db.employees.findIndex(e => e.id === payload.id);
        if (idx !== -1) {
          db.employees[idx] = Object.assign({}, db.employees[idx], payload);
          saveDB(db);
          pushToPhp('saveEmployee', db.employees[idx]);
          return { mode: 'edit', employee: db.employees[idx] };
        }
      }
      const cleanPayload = Object.assign({}, payload);
      delete cleanPayload.id;
      const uid = Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 4);
      const newEmp = Object.assign({
        id: 'EMP-' + uid.toUpperCase(),
        attendanceRate: 100
      }, cleanPayload);
      db.employees.unshift(newEmp);

      // Otomatis buatkan akun Portal Karyawan (ESS) jika email belum terdaftar
      const existsAcc = db.accounts.some(a => a.email.toLowerCase() === newEmp.email.toLowerCase());
      if (!existsAcc) {
        db.accounts.push({
          id: 'ACC-' + uid.toUpperCase(),
          nip: newEmp.nip,
          name: newEmp.name,
          email: newEmp.email,
          password: 'password123',
          role: 'KARYAWAN',
          lastLogin: 'Belum pernah login',
          active: newEmp.active !== false
        });
      }

      saveDB(db);
      pushToPhp('saveEmployee', newEmp);
      return { mode: 'create', employee: newEmp };
    },

    deleteEmployee(id) {
      const db = loadDB();
      db.employees = db.employees.filter(e => e.id !== id);
      saveDB(db);
      pushToPhp('deleteEmployee', { id });
    },

    /* ---------------- LEAVE REQUESTS (ESS <-> HR SYNC) ---------------- */
    getLeaveRequests() {
      return loadDB().leaveRequests;
    },

    submitLeaveRequest(req) {
      const db = loadDB();
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
      const item = {
        id: 'LV-' + Math.floor(100 + Math.random() * 900),
        nip: req.nip,
        employeeName: req.employeeName,
        dept: req.dept,
        type: req.type,
        startDate: req.startDate,
        endDate: req.endDate,
        days: diffDays,
        reason: req.reason,
        status: 'Pending',
        createdDate: formatLocalIsoDate(new Date())
      };
      db.leaveRequests.unshift(item);
      saveDB(db);
      pushToPhp('submitLeave', item);
      return item;
    },

    updateLeaveStatus(id, status) {
      const db = loadDB();
      const item = db.leaveRequests.find(l => l.id === id);
      if (item) {
        item.status = status;
        saveDB(db);
        pushToPhp('updateLeaveStatus', { id, status });
      }
      return item;
    },

    /* ---------------- ESS ATTENDANCE ---------------- */
    getEssAttendances(nip) {
      return loadDB().essAttendances.filter(a => !nip || a.nip === nip);
    },

    toggleCheckInOut(nip, modeText, extra = {}) {
      const db = loadDB();
      const emp = db.employees.find(e => e.nip === nip);
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 8) + ' WIB';
      const todayIso = formatLocalIsoDate(now);
      let todayRec = db.essAttendances.find(a => a.nip === nip && !a.checkOut);
      if (todayRec) {
        todayRec.checkOut = timeStr;
        if (extra.note) todayRec.note = extra.note;
        if (extra.photo) todayRec.photoOut = extra.photo;
        if (extra.gps) todayRec.gps = extra.gps;
        if (emp) {
          todayRec.employeeName = emp.name;
          todayRec.dept = emp.dept;
        }
        saveDB(db);
        pushToPhp('toggleCheckInOut', { action: 'checkout', nip, record: todayRec });
        return { action: 'checkout', record: todayRec };
      }
      // Deteksi otomatis Hadir Tepat Waktu vs Terlambat (toleransi shift 08:15 WIB)
      const totalMinutes = now.getHours() * 60 + now.getMinutes();
      const autoStatus = extra.status || (totalMinutes <= (8 * 60 + 15) ? 'Hadir Tepat Waktu' : 'Terlambat');
      const newRec = {
        id: 'ATT-' + Date.now().toString().slice(-4),
        nip,
        employeeName: emp ? emp.name : nip,
        dept: emp ? emp.dept : '-',
        date: todayIso,
        checkIn: timeStr,
        checkOut: null,
        mode: modeText || 'WFO - Kantor Pusat Jakarta',
        status: autoStatus,
        gps: extra.gps || '-6.2249, 106.8096 • SCBD Jakarta (38m)',
        note: extra.note || '',
        photo: extra.photo || null,
        photoOut: null
      };
      db.essAttendances.unshift(newRec);
      saveDB(db);
      pushToPhp('toggleCheckInOut', { action: 'checkin', nip, record: newRec });
      return { action: 'checkin', record: newRec };
    },

    /* ---------------- SUPER ADMIN RBAC & DEPARTMENTS ---------------- */
    getAccounts() {
      return loadDB().accounts;
    },

    updateAccountRole(accId, newRole) {
      const db = loadDB();
      const acc = db.accounts.find(a => a.id === accId);
      if (acc) {
        acc.role = newRole;
        saveDB(db);
        pushToPhp('updateAccountRole', { id: accId, role: newRole });
      }
      return acc;
    },

    toggleAccountActive(accId) {
      const db = loadDB();
      const acc = db.accounts.find(a => a.id === accId);
      if (acc) {
        acc.active = !acc.active;
        saveDB(db);
        pushToPhp('toggleAccountActive', { id: accId, active: acc.active });
      }
      return acc;
    },

    addAccount(payload) {
      const db = loadDB();
      const nipUpper = String(payload.nip || '').trim().toUpperCase();
      const emailLower = String(payload.email || '').trim().toLowerCase();
      if (db.accounts.some(a => a.nip.toUpperCase() === nipUpper)) {
        return { ok: false, message: `NIP ${nipUpper} sudah digunakan oleh akun lain.` };
      }
      if (db.accounts.some(a => a.email.toLowerCase() === emailLower)) {
        return { ok: false, message: `Email ${payload.email} sudah terdaftar.` };
      }
      const uid = Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 4);
      const acc = {
        id: 'ACC-' + uid.toUpperCase(),
        nip: nipUpper,
        name: payload.name,
        email: payload.email.trim(),
        password: payload.password || 'password123',
        role: payload.role,
        lastLogin: 'Belum pernah login',
        active: true
      };
      db.accounts.unshift(acc);
      saveDB(db);
      pushToPhp('addAccount', acc);
      return { ok: true, account: acc };
    },

    deleteAccount(accId) {
      const db = loadDB();
      db.accounts = db.accounts.filter(a => a.id !== accId);
      saveDB(db);
      pushToPhp('deleteAccount', { id: accId });
    },

    deleteDepartment(deptId) {
      const db = loadDB();
      db.departments = db.departments.filter(d => d.id !== deptId);
      saveDB(db);
      pushToPhp('deleteDepartment', { id: deptId });
    },

    resetAccountPassword(accId, newPassword) {
      const db = loadDB();
      const acc = db.accounts.find(a => a.id === accId);
      if (acc) {
        acc.password = String(newPassword || 'password123').trim();
        saveDB(db);
        pushToPhp('resetAccountPassword', { id: accId, password: acc.password });
      }
      return acc;
    },

    addDepartment(payload) {
      const db = loadDB();
      const dept = {
        id: payload.code.toUpperCase(),
        code: payload.code.toUpperCase(),
        name: payload.name,
        head: payload.head,
        quota: Number(payload.quota) || 10
      };
      db.departments.push(dept);
      saveDB(db);
      pushToPhp('addDepartment', dept);
      return dept;
    },

    getDepartmentsWithCounts() {
      const db = loadDB();
      return db.departments.map(d => {
        const emps = db.employees.filter(e => e.dept === d.name && e.active);
        const totalBase = emps.reduce((s, e) => s + Number(e.baseSalary || 0), 0);
        const totalAllow = emps.reduce((s, e) => s + Number(e.allowance || 0), 0);
        const avgAtt = emps.length
          ? (emps.reduce((s, e) => s + Number(e.attendanceRate || 95), 0) / emps.length).toFixed(1)
          : '0.0';
        const deduction = Math.round((totalBase + totalAllow) * 0.05);
        return Object.assign({}, d, {
          headcount: emps.length,
          avgAttendance: Number(avgAtt),
          totalBase,
          totalAllow,
          deduction,
          netPayroll: totalBase + totalAllow - deduction
        });
      });
    },

    updateDepartmentQuota(deptId, newQuota) {
      const db = loadDB();
      const d = db.departments.find(x => x.id === deptId);
      if (d) {
        d.quota = Number(newQuota) || d.quota;
        saveDB(db);
        pushToPhp('updateDepartmentQuota', { id: deptId, quota: d.quota });
      }
      return d;
    },

    /* ---------------- DASHBOARD SUMMARY METRICS & REAL ATTENDANCE ANALYTICS ---------------- */
    getMetrics() {
      const db = loadDB();
      const activeEmps = db.employees.filter(e => e.active && e.contract !== 'Nonaktif');
      const activeNips = new Set(activeEmps.map(e => e.nip));
      const todayIso = formatLocalIsoDate(new Date());

      // Hitung karyawan aktif yang benar-benar sudah Check-In hari ini
      const todayPresentSet = new Set(
        (db.essAttendances || [])
          .filter(a => a.date === todayIso && (!activeNips.size || activeNips.has(a.nip)))
          .map(a => a.nip)
      );
      const todayPresentCount = todayPresentSet.size;
      const todayRate = activeEmps.length
        ? ((todayPresentCount / activeEmps.length) * 100).toFixed(1).replace(/\.0$/, '')
        : '0';

      const pendingLeaves = db.leaveRequests.filter(l => l.status === 'Pending').length;
      const totalPayroll = activeEmps.reduce((s, e) => {
        const gross = Number(e.baseSalary || 0) + Number(e.allowance || 0);
        return s + Math.round(gross * 0.95);
      }, 0);
      return {
        activeCount: activeEmps.length,
        totalCount: db.employees.length,
        todayPresentCount,
        avgAttendance: todayRate,
        pendingLeaves,
        totalPayroll
      };
    },

    getAttendanceAnalytics(rangeMode = 'daily7') {
      const db = loadDB();
      const activeEmps = db.employees.filter(e => e.active && e.contract !== 'Nonaktif');
      const denom = Math.max(1, activeEmps.length);
      const logs = db.essAttendances || [];
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const now = new Date();

      if (rangeMode === 'monthly') {
        const labels = [];
        const rates = [];
        const details = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          labels.push(`${monthsShort[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`);
          // Hitung unik pasangan (nip + tanggal) pada bulan tersebut dibanding kapasitas kerja (denom * 22 hari kerja)
          const uniqueEmpDays = new Set(
            logs.filter(a => String(a.date || '').startsWith(ym)).map(a => `${a.nip}|${a.date}`)
          ).size;
          const targetCapacity = denom * 22;
          const pct = Number(Math.min(100, (uniqueEmpDays / targetCapacity) * 100).toFixed(1));
          rates.push(pct);
          details.push(`${uniqueEmpDays} dari ${targetCapacity} hari-orang (${ logs.filter(a => String(a.date || '').startsWith(ym)).length } log)`);
        }
        return { labels, rates, details, activeCount: activeEmps.length };
      }

      // Default: 7 Hari Terakhir (Real-Time per tanggal dari tabel attendances)
      const labels = [];
      const rates = [];
      const details = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const iso = formatLocalIsoDate(d);
        const lbl = i === 0 ? `Hari Ini (${d.getDate()} ${monthsShort[d.getMonth()]})` : `${d.getDate()} ${monthsShort[d.getMonth()]}`;
        labels.push(lbl);
        const presentNips = new Set(logs.filter(a => a.date === iso).map(a => a.nip));
        const count = presentNips.size;
        const pct = Number(Math.min(100, (count / denom) * 100).toFixed(1));
        rates.push(pct);
        details.push(`${count} dari ${activeEmps.length} karyawan hadir`);
      }
      return { labels, rates, details, activeCount: activeEmps.length };
    }
  };

  window.AuraStore = AuraStore;
})(window);
