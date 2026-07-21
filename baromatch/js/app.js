const BM_PLATFORM_FEE_RATE = 0.055;

const BM_CART_KEY    = 'BAROMATCH_CART_V1';
const BM_ORDERS_KEY   = 'BAROMATCH_ORDERS_V1';
const BM_ADDRESS_KEY  = 'BAROMATCH_ADDRESS_V1';
const BM_PROFILE_KEY  = 'BAROMATCH_PROFILE_V1';
const BM_CHECKOUT_KEY = 'BAROMATCH_CHECKOUT_V1';

function comma(n) {
  return Number(n).toLocaleString('ko-KR');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- Cart ----------
function getCart() {
  const stored = localStorage.getItem(BM_CART_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveCart(items) {
  localStorage.setItem(BM_CART_KEY, JSON.stringify(items));
}

function addToCart(id, qty) {
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });
  saveCart(cart);
}

function updateCartQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty = Math.max(1, qty);
  saveCart(cart);
}

function removeFromCart(ids) {
  const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
  saveCart(getCart().filter(i => !idSet.has(i.id)));
}

function getCartBadgeCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

// ---------- Orders / history ----------
function getSessionOrders() {
  const stored = localStorage.getItem(BM_ORDERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveSessionOrders(orders) {
  localStorage.setItem(BM_ORDERS_KEY, JSON.stringify(orders));
}

function buildOrderRecord(date, time, items, { expert, cardCompany, installment } = {}) {
  const subtotal = items.reduce((sum, i) => sum + bmSvc(i.id).price * i.qty, 0);
  const fee = Math.round(subtotal * BM_PLATFORM_FEE_RATE);
  const rand = String(Math.floor(100000 + Math.random() * 900000));
  return {
    date,
    time,
    orderNo: `ORD${date.replace(/-/g, '')}${rand}`,
    items,
    subtotal,
    fee,
    total: subtotal + fee,
    expert: expert ?? BM_EXPERTS[Math.floor(Math.random() * BM_EXPERTS.length)],
    cardCompany: cardCompany ?? BM_CARD_COMPANIES[0],
    installment: installment ?? BM_INSTALLMENTS[0],
  };
}

function getHistory() {
  const seeded = BM_HISTORY_SEED.map(o => buildSeededOrderRecord(o));
  return [...getSessionOrders(), ...seeded];
}

// Seeded orders need a stable orderNo across renders, so derive it
// deterministically from the date + item ids instead of buildOrderRecord's
// random suffix.
function buildSeededOrderRecord(seed) {
  const subtotal = seed.items.reduce((sum, i) => sum + bmSvc(i.id).price * i.qty, 0);
  const fee = Math.round(subtotal * BM_PLATFORM_FEE_RATE);
  let hash = 0;
  const key = seed.date + seed.items.map(i => i.id + i.qty).join('');
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const suffix = String(hash).slice(-6).padStart(6, '0');
  const hh = String(9 + (hash % 10)).padStart(2, '0');
  const mm = String((hash >> 3) % 60).padStart(2, '0');
  return {
    date: seed.date,
    time: `${hh}:${mm}`,
    orderNo: `ORD${seed.date.replace(/-/g, '')}${suffix}`,
    items: seed.items,
    subtotal,
    fee,
    total: subtotal + fee,
    expert: BM_EXPERTS[hash % BM_EXPERTS.length],
    cardCompany: BM_CARD_COMPANIES[hash % BM_CARD_COMPANIES.length],
    installment: BM_INSTALLMENTS[(hash >> 2) % BM_INSTALLMENTS.length],
  };
}

function addOrder(items, opts) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  const record = buildOrderRecord(date, time, items, opts);
  saveSessionOrders([record, ...getSessionOrders()]);
  return record;
}

function findOrder(orderNo) {
  return getHistory().find(o => o.orderNo === orderNo);
}

// ---------- Profile / address ----------
function getProfile() {
  const stored = localStorage.getItem(BM_PROFILE_KEY);
  return { ...BM_MEMBER, ...(stored ? JSON.parse(stored) : {}) };
}

function saveProfile(partial) {
  localStorage.setItem(BM_PROFILE_KEY, JSON.stringify({ ...getProfile(), ...partial }));
}

function getAddress() {
  const stored = localStorage.getItem(BM_ADDRESS_KEY);
  return stored ? JSON.parse(stored) : { base: '', detail: '' };
}

function saveAddress(addr) {
  localStorage.setItem(BM_ADDRESS_KEY, JSON.stringify(addr));
}

// ---------- Checkout hand-off ----------
function setCheckoutItems(items) {
  sessionStorage.setItem(BM_CHECKOUT_KEY, JSON.stringify(items));
}

function getCheckoutItems() {
  const stored = sessionStorage.getItem(BM_CHECKOUT_KEY);
  return stored ? JSON.parse(stored) : [];
}

// ---------- Service image ----------
function svcImageHtml(svc, height) {
  return `
    <div style="position:relative;width:100%;height:${height}px;border-radius:1rem 1rem 0 0;background:${svc.bg};display:flex;align-items:center;justify-content:center;overflow:hidden">
      ${svc.best ? `<span style="position:absolute;top:10px;left:10px;background:#1a2260;color:#fff;font-size:11px;font-weight:800;letter-spacing:0.03em;padding:4px 10px;border-radius:9999px">BEST</span>` : ''}
      <span style="font-size:${Math.round(height * 0.4)}px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.25))">${svc.icon}</span>
    </div>`;
}

// ---------- Toast ----------
function showBmToast(message) {
  document.getElementById('bm-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'bm-toast';
  toast.style.cssText = 'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:70;display:flex;align-items:center;gap:8px;background:#1a2260;color:#fff;font-size:13px;font-weight:600;padding:12px 18px;border-radius:9999px;box-shadow:0 8px 24px rgba(26,34,96,0.35);white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis;animation:bm-toast-in 0.2s ease-out';
  toast.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><span>${escapeHtml(message)}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

// ---------- Alert / Confirm ----------
function showBmAlert(message, onClose) {
  document.getElementById('bm-alert')?.remove();
  const modal = document.createElement('div');
  modal.id = 'bm-alert';
  modal.style.cssText = 'position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);padding:1rem';
  modal.innerHTML = `
    <div style="width:100%;max-width:340px;background:#fff;border-radius:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden">
      <div style="padding:1.5rem 1.5rem 1rem">
        <p style="font-size:0.875rem;color:#1a2260;line-height:1.6;white-space:pre-line">${escapeHtml(message)}</p>
      </div>
      <div style="display:flex;justify-content:flex-end;padding:0 1.5rem 1.25rem">
        <button id="bm-alert-ok" class="bm-btn-primary" style="padding:0.5rem 1.5rem;font-size:0.875rem">확인</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const close = () => { modal.remove(); onClose?.(); };
  document.getElementById('bm-alert-ok').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
}

function showBmConfirm(message, onYes) {
  document.getElementById('bm-confirm')?.remove();
  const modal = document.createElement('div');
  modal.id = 'bm-confirm';
  modal.style.cssText = 'position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);padding:1rem';
  modal.innerHTML = `
    <div style="width:100%;max-width:340px;background:#fff;border-radius:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden">
      <div style="padding:1.5rem 1.5rem 1rem">
        <p style="font-size:0.875rem;color:#1a2260;line-height:1.6;white-space:pre-line;text-align:center">${escapeHtml(message)}</p>
      </div>
      <div style="display:flex;gap:0.625rem;padding:0 1.5rem 1.25rem">
        <button id="bm-confirm-no" class="bm-btn-secondary" style="flex:1;padding:0.625rem 0;font-size:0.875rem">아니오</button>
        <button id="bm-confirm-yes" class="bm-btn-primary" style="flex:1;padding:0.625rem 0;font-size:0.875rem">예</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  document.getElementById('bm-confirm-no').addEventListener('click', close);
  document.getElementById('bm-confirm-yes').addEventListener('click', () => { modal.remove(); onYes?.(); });
}

// ---------- Inicis card payment module (mock PG popup) ----------
function openInicisModal({ amount, onSuccess, onCancel }) {
  document.getElementById('bm-inicis-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'bm-inicis-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:90;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:1rem';
  overlay.innerHTML = `
    <div style="width:100%;max-width:400px;max-height:92vh;background:#fff;border-radius:1rem;box-shadow:0 12px 40px rgba(0,0,0,0.35);overflow:hidden;display:flex;flex-direction:column">
      <div style="background:#101828;padding:14px 18px;display:flex;align-items:center;gap:8px;flex-shrink:0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span style="color:#fff;font-size:14px;font-weight:800;letter-spacing:0.01em">이니시스 안전결제</span>
        <span style="margin-left:auto;font-size:10px;color:#9ca3af;font-weight:600;border:1px solid #374151;border-radius:9999px;padding:2px 8px">TEST</span>
        <button id="inicis-close" aria-label="닫기" style="background:none;border:none;color:#9ca3af;font-size:1.1rem;line-height:1;cursor:pointer;padding:0 0 0 8px">×</button>
      </div>

      <div style="overflow-y:auto;padding:18px">
        <div style="background:#f9fafb;border-radius:0.75rem;padding:14px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12.5px;color:#6b7280;font-weight:600">결제금액</span>
          <span style="font-size:19px;font-weight:800;color:#1a2260">${comma(amount)}원</span>
        </div>

        <p style="font-size:12px;font-weight:800;color:#374151;margin:0 0 8px">카드사 선택</p>
        <div id="inicis-card-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px">
          ${BM_CARD_COMPANIES.map(name => `
            <button type="button" class="inicis-card-opt" data-card="${escapeHtml(name)}" style="border:1px solid #e5e7eb;border-radius:0.5rem;background:#fff;color:#4b5563;font-size:10.5px;font-weight:700;padding:8px 2px;cursor:pointer">${escapeHtml(name.replace('카드', ''))}</button>
          `).join('')}
        </div>

        <p style="font-size:12px;font-weight:800;color:#374151;margin:0 0 8px">카드 번호</p>
        <div style="display:flex;gap:6px;margin-bottom:14px">
          ${[0, 1, 2, 3].map(i => `<input class="bm-field inicis-card-num" data-idx="${i}" inputmode="numeric" maxlength="4" placeholder="0000" style="text-align:center;padding:0;height:2.5rem">`).join('')}
        </div>

        <div style="display:flex;gap:10px;margin-bottom:14px">
          <div style="flex:1">
            <p style="font-size:12px;font-weight:800;color:#374151;margin:0 0 8px">유효기간(MM/YY)</p>
            <div style="display:flex;gap:6px">
              <input id="inicis-exp-mm" class="bm-field" inputmode="numeric" maxlength="2" placeholder="MM" style="text-align:center;padding:0;height:2.5rem">
              <input id="inicis-exp-yy" class="bm-field" inputmode="numeric" maxlength="2" placeholder="YY" style="text-align:center;padding:0;height:2.5rem">
            </div>
          </div>
          <div style="flex:1">
            <p style="font-size:12px;font-weight:800;color:#374151;margin:0 0 8px">비밀번호 앞 2자리</p>
            <input id="inicis-pwd" class="bm-field" type="password" inputmode="numeric" maxlength="2" placeholder="••" style="text-align:center;padding:0;height:2.5rem">
          </div>
        </div>

        <p style="font-size:12px;font-weight:800;color:#374151;margin:0 0 8px">할부 개월</p>
        <select id="inicis-installment" class="bm-field" style="margin-bottom:16px;height:2.5rem">
          ${BM_INSTALLMENTS.map(v => `<option value="${v}">${v}</option>`).join('')}
        </select>

        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#6b7280;margin-bottom:4px;cursor:pointer">
          <input type="checkbox" id="inicis-agree" style="width:16px;height:16px;accent-color:#1a2260">
          결제 정보 확인 및 결제 진행에 동의합니다.
        </label>
      </div>

      <div style="padding:14px 18px;border-top:1px solid #f3f4f6;flex-shrink:0">
        <button id="inicis-pay-btn" class="bm-btn-primary" style="width:100%;height:48px;font-size:15px" disabled>${comma(amount)}원 결제하기</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => { overlay.remove(); onCancel?.(); };
  document.getElementById('inicis-close').addEventListener('click', close);

  let selectedCard = null;
  const cardBtns = overlay.querySelectorAll('.inicis-card-opt');
  const numInputs = [...overlay.querySelectorAll('.inicis-card-num')];
  const mmInput = document.getElementById('inicis-exp-mm');
  const yyInput = document.getElementById('inicis-exp-yy');
  const pwdInput = document.getElementById('inicis-pwd');
  const agreeInput = document.getElementById('inicis-agree');
  const payBtn = document.getElementById('inicis-pay-btn');

  function refreshValidity() {
    const numsFilled = numInputs.every(inp => inp.value.length === 4);
    payBtn.disabled = !(selectedCard && numsFilled && mmInput.value.length === 2 && yyInput.value.length === 2 && pwdInput.value.length === 2 && agreeInput.checked);
  }

  cardBtns.forEach(btn => btn.addEventListener('click', () => {
    selectedCard = btn.dataset.card;
    cardBtns.forEach(b => { b.style.background = b === btn ? '#1a2260' : '#fff'; b.style.color = b === btn ? '#fff' : '#4b5563'; b.style.borderColor = b === btn ? '#1a2260' : '#e5e7eb'; });
    refreshValidity();
  }));

  numInputs.forEach((inp, idx) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 4);
      if (inp.value.length === 4 && numInputs[idx + 1]) numInputs[idx + 1].focus();
      refreshValidity();
    });
  });
  [mmInput, yyInput, pwdInput].forEach(inp => {
    inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 2); refreshValidity(); });
  });
  agreeInput.addEventListener('change', refreshValidity);

  payBtn.addEventListener('click', () => {
    payBtn.disabled = true;
    payBtn.textContent = '결제 처리 중...';
    const installment = document.getElementById('inicis-installment').value;
    setTimeout(() => {
      overlay.remove();
      onSuccess?.({ cardCompany: selectedCard, installment });
    }, 900);
  });
}

// ---------- Bottom sheet ----------
function openBmSheet(bodyHtml, onMount) {
  document.getElementById('bm-sheet-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'bm-sheet-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:75;background:rgba(0,0,0,0.45);display:flex;align-items:flex-end;justify-content:center';
  overlay.innerHTML = `
    <div id="bm-sheet" style="width:100%;max-width:480px;background:#fff;border-radius:1.25rem 1.25rem 0 0;box-shadow:0 -8px 32px rgba(0,0,0,0.18);max-height:88vh;overflow-y:auto;animation:bm-sheet-in 0.22s ease-out">
      <div style="display:flex;justify-content:center;padding:10px 0 2px"><span style="width:36px;height:4px;border-radius:9999px;background:#e5e7eb"></span></div>
      <div style="position:relative;padding:0.5rem 1.25rem 1.5rem">
        <button id="bm-sheet-close" aria-label="닫기" style="position:absolute;top:0.25rem;right:1.25rem;width:28px;height:28px;border-radius:9999px;border:none;background:#f3f4f6;color:#6b7280;cursor:pointer;font-size:1rem;line-height:1">×</button>
        ${bodyHtml}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  document.getElementById('bm-sheet-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  onMount?.(close);
  return close;
}

// ---------- Bottom nav ----------
const BM_NAV = [
  { key: 'index',   label: '매칭요청', href: 'index.html',   iconPath: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z;m21 21-4.35-4.35' },
  { key: 'basket',  label: '장바구니', href: 'basket.html',  iconPath: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z;M3 6h18;M16 10a4 4 0 0 1-8 0', isCart: true },
  { key: 'history', label: '결제내역', href: 'history.html', iconPath: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z;M9 7h6;M9 11h6;M9 15h4' },
  { key: 'myinfo',  label: '내정보',   href: 'myinfo.html',  iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2;M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
];

function svgIcon(paths, size = 22, color = 'currentColor') {
  const pathEls = paths.split(';').map(d => `<path d="${d}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">${pathEls}</svg>`;
}

function renderBmNav(activeKey) {
  const el = document.getElementById('bm-bottom-nav');
  if (!el) return;
  const cartCount = getCartBadgeCount();
  el.innerHTML = `
    <nav style="position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:480px;z-index:30;display:flex;background:#fff;box-shadow:0 -1px 4px rgba(0,0,0,0.08);padding:6px 2px calc(6px + env(safe-area-inset-bottom))">
      ${BM_NAV.map(n => {
        const active = n.key === activeKey;
        const badge = n.isCart && cartCount > 0
          ? `<span style="position:absolute;top:0;right:calc(50% - 20px);display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 3px;background:#e4572e;color:#fff;font-size:10px;font-weight:700;border-radius:9999px">${cartCount > 9 ? '9+' : cartCount}</span>`
          : '';
        return `
        <a href="${n.href}" style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;flex:1;padding:4px 0;text-decoration:none;color:${active ? '#1a2260' : '#9ca3af'}">
          ${badge}
          ${svgIcon(n.iconPath, 22)}
          <span style="font-size:11px;font-weight:${active ? '800' : '600'}">${n.label}</span>
        </a>`;
      }).join('')}
    </nav>`;
}

// ---------- Back header (sub pages) ----------
function renderBmBackHeader(title, rightHtml) {
  const el = document.getElementById('bm-back-header');
  if (!el) return;
  el.innerHTML = `
    <header style="position:sticky;top:0;left:0;right:0;z-index:20;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.06);height:52px;display:flex;align-items:center;padding:0 1rem;gap:0.5rem">
      <a href="javascript:void(0)" id="bm-back-btn" style="display:flex;color:#374151;flex-shrink:0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </a>
      <h1 style="font-size:1.0625rem;font-weight:800;color:#111827;flex:1">${escapeHtml(title)}</h1>
      ${rightHtml ?? ''}
    </header>`;
  document.getElementById('bm-back-btn').addEventListener('click', () => {
    if (document.referrer && new URL(document.referrer).pathname.includes('/baromatch/')) history.back();
    else window.location.href = 'index.html';
  });
}
