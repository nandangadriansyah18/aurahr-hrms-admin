/**
 * AuraHR — Shared UI Shell, RBAC Route Guard, Global Search, Modals & Toasts
 */
(function (window, document) {
  'use strict';

  function getBasePath() {
    if (document.body && document.body.dataset.base) {
      return document.body.dataset.base;
    }
    const p = window.location.pathname.replace(/\\/g, '/');
    return p.includes('/pages/') ? '..' : '.';
  }

  function formatRupiah(num) {
    const n = Number(num) || 0;
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  function formatCompactRupiah(num) {
    const n = Number(num) || 0;
    if (n >= 1000000000) {
      return 'Rp ' + (n / 1000000000).toFixed(2).replace('.', ',') + ' M';
    }
    if (n >= 1000000) {
      return 'Rp ' + (n / 1000000).toFixed(1).replace('.', ',') + ' Jt';
    }
    return formatRupiah(n);
  }

  function formatDateIndo(iso) {
    if (!iso) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const parts = String(iso).split('-');
    if (parts.length !== 3) return iso;
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  }

  function initials(name) {
    return String(name || 'AU')
      .replace(/,.*/, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w[0] || '')
      .join('')
      .toUpperCase();
  }

  function contractBadge(contract) {
    const map = {
      'Tetap': 'badge--active',
      'Kontrak': 'badge--info',
      'Probation': 'badge--warning',
      'Nonaktif': 'badge--danger'
    };
    return `<span class="badge ${map[contract] || 'badge--info'}">${contract}</span>`;
  }

  function roleBadge(role) {
    if (role === 'SUPER_ADMIN') return '<span class="badge badge--role-admin">Super Admin</span>';
    if (role === 'HR') return '<span class="badge badge--role-hr">HR Management</span>';
    return '<span class="badge badge--role-ess">Karyawan</span>';
  }

  /* ---------------- TOAST NOTIFICATION ---------------- */
  function showToast(message, tone = 'success') {
    let stack = document.getElementById('auraToastStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'auraToastStack';
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const item = document.createElement('div');
    item.className = `toast toast--${tone}`;
    item.innerHTML = `<span>${message}</span>`;
    stack.appendChild(item);
    setTimeout(() => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      item.style.transition = 'all 0.2s ease';
      setTimeout(() => item.remove(), 220);
    }, 3200);
  }

  /* ---------------- REUSABLE MODAL DIALOG ---------------- */
  function openModal({ title, bodyHtml, confirmText = 'Konfirmasi', cancelText = 'Batal', confirmClass = 'btn--primary', onConfirm, hideFooter = false }) {
    let overlay = document.getElementById('auraModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'auraModalOverlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true">
        <div class="modal-card__head">
          <h3 class="modal-card__title">${title}</h3>
          <button type="button" class="btn btn--icon" data-modal-close aria-label="Tutup">✕</button>
        </div>
        <div class="modal-card__body">${bodyHtml}</div>
        ${hideFooter ? '' : `
          <div class="modal-card__foot">
            <button type="button" class="btn btn--glass" data-modal-close>${cancelText}</button>
            <button type="button" class="btn ${confirmClass}" id="auraModalConfirmBtn">${confirmText}</button>
          </div>
        `}
      </div>
    `;

    requestAnimationFrame(() => overlay.classList.add('is-open'));

    const close = () => overlay.classList.remove('is-open');
    overlay.querySelectorAll('[data-modal-close]').forEach(btn => btn.addEventListener('click', close));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    const confirmBtn = overlay.querySelector('#auraModalConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (typeof onConfirm === 'function') {
          const shouldClose = onConfirm(close);
          if (shouldClose !== false) close();
        } else {
          close();
        }
      });
    }
  }

  /* ---------------- RBAC ROUTE GUARD & SHELL HYDRATION ---------------- */
  function initShell() {
    if (!window.AuraStore) return;
    const base = getBasePath();
    const pagePrefix = base === '.' ? './pages' : '.';
    const rootPrefix = base === '.' ? '.' : '..';
    const activePage = document.body.dataset.page || '';

    // Login page does not need app shell hydration
    if (activePage === 'login') return;

    let session = window.AuraStore.getSession();

    // Enforce authentication on protected pages (except standalone layout.html preview)
    if (!session) {
      if (activePage === 'layout') {
        session = {
          id: 'ACC-02',
          nip: 'AUR-0021',
          name: 'Siti Rahmawati, S.Psi',
          email: 'siti.rahma@aurahr.id',
          role: 'HR',
          title: 'Senior HR Specialist'
        };
      } else {
        window.location.href = `${rootPrefix}/index.html`;
        return;
      }
    }

    // Strict RBAC route protection
    if (session.role === 'KARYAWAN' && ['dashboard', 'data-master', 'form', 'laporan', 'rbac'].includes(activePage)) {
      window.location.href = `${pagePrefix}/portal-karyawan.html`;
      return;
    }
    if (session.role === 'HR' && activePage === 'rbac') {
      window.location.href = `${pagePrefix}/dashboard.html`;
      return;
    }

    const metrics = window.AuraStore.getMetrics();

    // Populate Sidebar Menu Dynamically by Role
    const navContainer = document.getElementById('sidebarNavContainer');
    if (navContainer) {
      if (session.role === 'KARYAWAN') {
        navContainer.innerHTML = `
          <div>
            <p class="sidebar__group-label">Layanan Mandiri</p>
            <ul class="sidebar__menu">
              <li>
                <button type="button" class="sidebar__link ${activePage === 'ess' ? 'is-active' : ''}" data-ess-view="home" style="width:100%;text-align:left;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
                  <span>Beranda &amp; Presensi</span>
                </button>
              </li>
              <li>
                <button type="button" class="sidebar__link" data-ess-view="leave" style="width:100%;text-align:left;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>Pengajuan Cuti &amp; Izin</span>
                </button>
              </li>
              <li>
                <button type="button" class="sidebar__link" data-ess-action="payslip" style="width:100%;text-align:left;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>Slip Gaji Digital</span>
                </button>
              </li>
            </ul>
          </div>
        `;
      } else {
        navContainer.innerHTML = `
          <div>
            <p class="sidebar__group-label">Utama</p>
            <ul class="sidebar__menu">
              <li>
                <a href="${pagePrefix}/dashboard.html" class="sidebar__link ${activePage === 'dashboard' ? 'is-active' : ''}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
                  <span>Dashboard SDM</span>
                  ${metrics.pendingLeaves > 0 ? `<span class="sidebar__badge">${metrics.pendingLeaves}</span>` : ''}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p class="sidebar__group-label">Kepegawaian</p>
            <ul class="sidebar__menu">
              <li>
                <a href="${pagePrefix}/data-master.html" class="sidebar__link ${activePage === 'data-master' ? 'is-active' : ''}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>Data Master Karyawan</span>
                </a>
              </li>
              <li>
                <a href="${pagePrefix}/form.html" class="sidebar__link ${activePage === 'form' ? 'is-active' : ''}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  <span>Tambah / Edit Pegawai</span>
                </a>
              </li>
              <li>
                <a href="${pagePrefix}/laporan.html" class="sidebar__link ${activePage === 'laporan' ? 'is-active' : ''}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>Laporan &amp; Payroll</span>
                </a>
              </li>
            </ul>
          </div>
          ${session.role === 'SUPER_ADMIN' ? `
            <div>
              <p class="sidebar__group-label">Administrasi Sistem</p>
              <ul class="sidebar__menu">
                <li>
                  <a href="${pagePrefix}/manajemen-role.html" class="sidebar__link ${activePage === 'rbac' ? 'is-active' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>Manajemen Role &amp; Divisi</span>
                  </a>
                </li>
              </ul>
            </div>
          ` : ''}
        `;
      }
    }

    // Populate User Profile Pill
    const nameEl = document.getElementById('topbarUserName');
    const roleEl = document.getElementById('topbarUserRole');
    const avatarEl = document.getElementById('topbarUserAvatar');
    const notifBadge = document.getElementById('topbarNotifCount');

    if (nameEl) nameEl.textContent = session.name;
    if (roleEl) roleEl.textContent = session.role === 'SUPER_ADMIN' ? 'Super Admin' : (session.role === 'HR' ? 'HR Management' : 'Karyawan');
    if (avatarEl) avatarEl.textContent = initials(session.name);
    if (notifBadge) {
      notifBadge.textContent = metrics.pendingLeaves;
      notifBadge.style.display = metrics.pendingLeaves > 0 ? 'grid' : 'none';
    }

    // Sidebar Toggle (Desktop Collapse + Mobile Off-Canvas Drawer)
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 920) {
          document.body.classList.toggle('sidebar-mobile-open');
          if (backdrop) backdrop.classList.toggle('is-visible', document.body.classList.contains('sidebar-mobile-open'));
        } else {
          document.body.classList.toggle('sidebar-collapsed');
        }
      });
    }
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        document.body.classList.remove('sidebar-mobile-open');
        backdrop.classList.remove('is-visible');
      });
    }

    // Notification Button Modal
    const notifBtn = document.getElementById('topbarNotifBtn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        const pending = window.AuraStore.getLeaveRequests().filter(l => l.status === 'Pending');
        const listHtml = pending.length === 0
          ? '<p style="color:var(--text-secondary);">Tidak ada pengajuan cuti yang menunggu persetujuan saat ini.</p>'
          : `<div style="display:flex;flex-direction:column;gap:10px;">
              ${pending.map(p => `
                <div style="padding:12px;border-radius:12px;background:#F8FAFC;border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;gap:10px;">
                  <div>
                    <div style="font-weight:700;">${p.employeeName} <span class="mono" style="font-size:0.75rem;color:var(--text-secondary);">(${p.nip})</span></div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);">${p.type} • ${formatDateIndo(p.startDate)} – ${formatDateIndo(p.endDate)} (${p.days} hari)</div>
                  </div>
                  <span class="badge badge--warning">Pending</span>
                </div>
              `).join('')}
            </div>`;
        openModal({
          title: `Pengajuan Cuti Masuk (${pending.length})`,
          bodyHtml: listHtml,
          confirmText: 'Kelola di Dashboard',
          onConfirm: () => {
            window.location.href = `${pagePrefix}/dashboard.html`;
          }
        });
      });
    }

    // Logout Buttons
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.AuraStore.logout();
        window.location.href = `${rootPrefix}/index.html`;
      });
    });

    // Global Quick Search (Ctrl+K)
    const searchInput = document.getElementById('globalSearchInput');
    const searchDropdown = document.getElementById('globalSearchDropdown');
    if (searchInput && searchDropdown) {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          searchInput.focus();
        }
      });

      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) {
          searchDropdown.classList.remove('is-open');
          return;
        }
        const matches = window.AuraStore.getEmployees().filter(emp =>
          emp.name.toLowerCase().includes(q) ||
          emp.nip.toLowerCase().includes(q) ||
          emp.dept.toLowerCase().includes(q)
        ).slice(0, 5);

        if (matches.length === 0) {
          searchDropdown.innerHTML = `<div style="padding:12px;color:var(--text-secondary);font-size:0.8rem;">Tidak ditemukan pegawai untuk "${searchInput.value}"</div>`;
        } else {
          searchDropdown.innerHTML = matches.map(m => `
            <a href="${pagePrefix}/data-master.html?q=${encodeURIComponent(m.nip)}" class="search-result-item">
              <div>
                <div style="font-weight:700;font-size:0.82rem;">${m.name}</div>
                <div style="font-size:0.73rem;color:var(--text-secondary);">${m.position} • ${m.dept}</div>
              </div>
              <span class="mono" style="font-size:0.74rem;color:var(--color-primary);font-weight:700;">${m.nip}</span>
            </a>
          `).join('');
        }
        searchDropdown.classList.add('is-open');
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.classList.remove('is-open');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initShell);

  window.AuraApp = {
    getBasePath,
    formatRupiah,
    formatCompactRupiah,
    formatDateIndo,
    initials,
    contractBadge,
    roleBadge,
    showToast,
    openModal,
    initShell
  };
})(window, document);
