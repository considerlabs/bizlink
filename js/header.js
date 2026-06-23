const NAV = [
  { label: '주문',       href: 'order.html',           iconPath: 'M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z' },
  { label: '장바구니',   href: 'basket.html',           iconPath: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z;M3 6h18;M16 10a4 4 0 0 1-8 0', isCart: true },
  { label: '구매내역',   href: 'history.html',          iconPath: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z;M9 7h6;M9 11h6;M9 15h4' },
  { label: '공급자관리', href: 'vendors.html',          iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z;M9 22V12h6v10' },
  { label: '발주서주문', href: 'purchase-orders.html',  iconPath: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2;M8 2h8v4H8z;M9 12h6;M9 16h4' },
  { label: '내정보',     href: 'myinfo.html',           iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2;M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
];

function svgIcon(paths, size = 14, color = 'currentColor') {
  const dList = paths.split(';');
  const pathEls = dList.map(d => `<path d="${d}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">${pathEls}</svg>`;
}

function renderHeader() {
  const page = location.pathname.split('/').pop() || 'order.html';
  const storeInfo = getStoreInfo();
  const cartCount = getCartCount();

  const navHtml = NAV.map(({ label, href, iconPath, isCart }) => {
    const active = page === href || (href === 'history.html' && page === 'history-detail.html');
    const badge = isCart && cartCount > 0
      ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:1rem;height:1rem;background:#5a6abf;color:#fff;font-size:10px;font-weight:700;border-radius:9999px">${cartCount > 9 ? '9+' : cartCount}</span>`
      : '';
    return `
      <a href="${href}" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-size:0.875rem;font-weight:600;text-decoration:none;transition:background 0.15s;${active ? 'background:#eef0f9;color:#2B3990' : 'color:#4b5563'}">
        ${svgIcon(iconPath)}
        <span class="nav-label">${label}</span>
        ${badge}
      </a>`;
  }).join('');

  const el = document.getElementById('app-header');
  if (!el) return;
  el.innerHTML = `
    <header style="position:fixed;top:0;left:0;right:0;z-index:30;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.08);height:58px;display:flex;align-items:center;padding:0 1rem;gap:0.75rem">
      <a href="order.html" style="display:flex;align-items:center;flex-shrink:0;text-decoration:none">
        <img src="img/logo.jpg" alt="BIZLINK" style="height:28px;width:auto;object-fit:contain">
      </a>
      <nav style="display:flex;align-items:center;gap:4px;margin-left:8px;flex:1;overflow:hidden">${navHtml}</nav>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        ${storeInfo ? `<div style="display:none" class="md-show" style="flex-direction:column;align-items:flex-end;line-height:1.2">
          <span style="font-size:10px;color:#9ca3af;font-weight:500">잔액</span>
          <span style="font-size:0.875rem;font-weight:700;color:#2B3990">${comma(storeInfo.UABLE_PAY)}원</span>
        </div>` : ''}
        <div style="position:relative" id="myinfo-wrapper">
          <button id="myinfo-toggle-btn" style="display:flex;align-items:center;gap:6px;padding:8px;border-radius:9999px;border:none;background:none;cursor:pointer;color:#4b5563">
            ${svgIcon('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2;M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 18)}
            <span style="font-size:0.75rem;font-weight:600;color:#1a2260;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" class="nav-label">${escapeHtml(storeInfo?.BIZ_NAME ?? '')}</span>
          </button>
          <div id="myinfo-panel" style="display:none"></div>
        </div>
        <button id="header-logout-btn" class="nav-label" style="border-radius:9999px;border:1px solid #e5e7eb;padding:6px 12px;font-size:0.75rem;font-weight:700;color:#6b7280;background:#fff;cursor:pointer">로그아웃</button>
      </div>
    </header>
    <style>
      @media(max-width:767px){ .nav-label{display:none!important} }
      @media(min-width:768px){ .md-show{display:flex!important} }
    </style>
  `;

  document.getElementById('header-logout-btn').addEventListener('click', () => {
    api.logout().then(() => { window.location.href = 'login.html'; });
  });

  const toggle = document.getElementById('myinfo-toggle-btn');
  const panel  = document.getElementById('myinfo-panel');
  const wrapper = document.getElementById('myinfo-wrapper');

  toggle?.addEventListener('click', e => {
    e.stopPropagation();
    const visible = panel.style.display !== 'none';
    if (visible) { panel.style.display = 'none'; panel.innerHTML = ''; }
    else {
      panel.style.display = 'block';
      panel.innerHTML = renderMyInfoPanel(storeInfo);
    }
  });
  document.addEventListener('click', e => {
    if (wrapper && !wrapper.contains(e.target)) { panel.style.display = 'none'; panel.innerHTML = ''; }
  });
}

function renderMyInfoPanel(info) {
  return `
    <div style="position:absolute;right:0;top:calc(100% + 4px);width:280px;background:#fff;border-radius:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;z-index:40">
      <div style="padding:12px 16px;background:#eef0f9;border-bottom:1px solid #d4d8f0">
        <p style="font-size:0.75rem;color:#6b7280;margin-bottom:2px">잔액</p>
        <p style="font-size:1.25rem;font-weight:800;color:#2B3990">${comma(info.UABLE_PAY)}원</p>
      </div>
      <div style="padding:12px 16px;display:flex;flex-direction:column;gap:6px">
        ${[['상점명', info.BIZ_NAME], ['사업자번호', info.BIZ_NUM], ['대표자', info.BIZ_OWNER]].map(([k, v]) =>
          `<div style="display:flex;justify-content:space-between;font-size:0.75rem"><span style="color:#9ca3af">${k}</span><span style="font-weight:600;color:#1a2260">${escapeHtml(v ?? '')}</span></div>`
        ).join('')}
      </div>
      <div style="padding:0 16px 16px">
        <a href="myinfo.html" class="btn-primary" style="display:block;width:100%;text-align:center;padding:8px 0;font-size:0.75rem;border-radius:8px">내정보 관리</a>
      </div>
    </div>`;
}
