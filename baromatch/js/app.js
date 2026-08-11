const BM_PLATFORM_FEE_RATE = 0.055;

const BM_CART_KEY    = 'BAROMATCH_CART_V1';
const BM_ORDERS_KEY   = 'BAROMATCH_ORDERS_V1';
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

// ---------- Profile ----------
function getProfile() {
  const stored = localStorage.getItem(BM_PROFILE_KEY);
  return { ...BM_MEMBER, ...(stored ? JSON.parse(stored) : {}) };
}

function saveProfile(partial) {
  localStorage.setItem(BM_PROFILE_KEY, JSON.stringify({ ...getProfile(), ...partial }));
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
function svcImageHtml(svc, height, radius = '1rem 1rem 0 0') {
  return `
    <div style="position:relative;width:100%;height:${height}px;border-radius:${radius};background:${svc.bg};display:flex;align-items:center;justify-content:center;overflow:hidden">
      ${svc.best ? `<span style="position:absolute;top:10px;left:10px;background:#1a2260;color:#fff;font-size:11px;font-weight:800;letter-spacing:0.03em;padding:4px 10px;border-radius:9999px">BEST</span>` : ''}
      <span style="font-size:${Math.round(height * 0.4)}px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.25))">${svc.icon}</span>
    </div>`;
}

// ---------- Product detail sheet ----------
function openProductDetail(svc) {
  document.getElementById('bm-detail-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'bm-detail-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:75;background:rgba(0,0,0,0.45);display:flex;align-items:flex-end;justify-content:center;padding:0';
  document.body.appendChild(overlay);

  let qty = 1;
  const categoryLabel = BM_CATEGORIES.find(c => c.key === svc.category)?.label ?? '';

  overlay.innerHTML = `
    <div style="width:100%;max-width:480px;max-height:92vh;background:#fff;border-radius:1.25rem 1.25rem 0 0;box-shadow:0 -8px 32px rgba(0,0,0,0.18);overflow-y:auto;animation:bm-sheet-in 0.22s ease-out;position:relative">
      <button id="pd-close" aria-label="닫기" style="position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:9999px;background:rgba(255,255,255,0.92);border:none;color:#374151;font-size:1.1rem;line-height:1;cursor:pointer;z-index:2;box-shadow:0 2px 6px rgba(0,0,0,0.15)">×</button>
      ${svcImageHtml(svc, 300, '1.25rem 1.25rem 0 0')}
      <div style="padding:18px 20px 24px">
        <p style="font-size:12px;color:#9ca3af;font-weight:600;margin-bottom:4px">${escapeHtml(categoryLabel)}</p>
        <h2 style="font-size:19px;font-weight:800;color:#1f2937;margin-bottom:8px">${escapeHtml(svc.name)}</h2>
        <div style="font-size:12.5px;color:#6b7280;margin-bottom:14px;display:flex;align-items:center;gap:4px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>${svc.rating} · 리뷰 ${svc.reviews}개 · 재고 ${svc.stock}개</span>
        </div>
        <p style="font-size:22px;font-weight:800;color:#1a2260;margin-bottom:16px">${comma(svc.price)}원</p>
        <div style="background:#f9fafb;border-radius:0.75rem;padding:14px 16px;font-size:13px;color:#4b5563;line-height:1.6;margin-bottom:22px">${escapeHtml(svc.desc)}</div>

        <p style="font-size:13px;font-weight:800;color:#374151;margin-bottom:10px">수량</p>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <button id="pd-dec" class="bm-qty-btn" style="width:36px;height:36px;font-size:18px">−</button>
          <span id="pd-qty" style="min-width:28px;text-align:center;font-size:16px;font-weight:700">1</span>
          <button id="pd-inc" class="bm-qty-btn" style="width:36px;height:36px;font-size:18px">+</button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid #f3f4f6;margin-bottom:18px">
          <span style="font-size:13.5px;font-weight:700;color:#374151">총 상품금액</span>
          <span id="pd-total" style="font-size:18px;font-weight:800;color:#1a2260">${comma(svc.price)}원</span>
        </div>

        <div style="display:flex;gap:10px">
          <button id="pd-add-cart" class="bm-btn-secondary" style="flex:1;height:48px;font-size:14.5px;border-color:#1a2260;color:#1a2260">장바구니 담기</button>
          <button id="pd-buy-now" class="bm-btn-primary" style="flex:1;height:48px;font-size:14.5px">바로 구매</button>
        </div>
      </div>
    </div>`;

  const close = () => overlay.remove();
  document.getElementById('pd-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  const qtyEl = document.getElementById('pd-qty');
  const totalEl = document.getElementById('pd-total');
  const updateQty = () => { qtyEl.textContent = qty; totalEl.textContent = `${comma(svc.price * qty)}원`; };

  document.getElementById('pd-dec').addEventListener('click', () => { qty = Math.max(1, qty - 1); updateQty(); });
  document.getElementById('pd-inc').addEventListener('click', () => { qty += 1; updateQty(); });
  document.getElementById('pd-add-cart').addEventListener('click', () => {
    addToCart(svc.id, qty);
    close();
    renderBmNav('index');
    showBmToast(`${svc.name}을(를) 장바구니에 담았습니다.`);
  });
  document.getElementById('pd-buy-now').addEventListener('click', () => {
    setCheckoutItems([{ id: svc.id, qty }]);
    window.location.href = 'checkout.html';
  });
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
  modal.style.cssText = 'position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);padding:1rem';
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
  modal.style.cssText = 'position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);padding:1rem';
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

// ---------- Service contract (계약 확인 → 동의 → 서명 → 완료) ----------
function showBmContractModal({ items, expert, categoryLabel, subtotal, total, member, onComplete, onCancel }) {
  document.getElementById('bm-contract-overlay')?.remove();

  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  const contractNo = `CTR-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
  const contractDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const serviceLabel = items.length > 1 ? `${items[0].svc.name} 외 ${items.length - 1}건` : items[0].svc.name;

  const STEP_LABELS = ['계약 확인', '동의', '서명', '완료'];
  const CLAUSES = [
    ['제1조 (계약 목적)', '본 계약은 바로매치 플랫폼을 통해 이용자와 헬퍼 간에 체결되는 생활용역서비스 이용에 관한 사항을 정하며, 이용자의 서비스 이용 및 전자서명 의사를 확인하기 위해 작성됩니다.'],
    ['제2조 (서비스 내용 및 금액)', `이용자는 배정된 헬퍼로부터 아래 서비스를 제공받으며, 서비스 금액을 확인하고 결제에 동의합니다.\n· 서비스 유형: ${escapeHtml(categoryLabel)} 용역서비스\n· 서비스 금액은 계약서 상단에 표기된 금액을 기준으로 합니다.\n· 이용자는 서비스 이용 전 배정된 헬퍼 정보를 반드시 확인합니다.`],
    ['제3조 (결제 조건)', '이용자는 본 계약서에 전자서명 완료 후 결제를 진행합니다. 결제 완료 후 서비스 금액은 바로매치 플랫폼을 통해 배정된 헬퍼에게 정산됩니다.'],
    ['제4조 (환불 및 취소 규정)', '1. 서비스 시작 전 취소 시 전액 환불됩니다.\n2. 서비스 진행 중 취소 시 환불이 불가합니다.\n3. 서비스 완료 후에는 취소·환불이 불가합니다. 단, 서비스 하자가 있는 경우 고객센터를 통해 처리합니다.\n4. 단순 변심에 의한 취소는 서비스 시작 전에만 가능합니다.\n5. 전자서명 후 서비스 시작 전 취소는 바로매치 고객센터에 요청하시기 바랍니다.'],
    ['제5조 (개인정보 및 기록 보관)', '전자서명 기록 및 결제 기록은 관련 법령에 따라 보관되며, 분쟁 발생 시 증빙 자료로 활용될 수 있습니다. 이용자의 개인정보는 바로매치 개인정보처리방침에 따라 처리됩니다.'],
    ['제6조 (플랫폼 중개 서비스)', '바로매치는 청소·가사도우미·심부름·레슨 등 생활용역서비스를 중개하는 플랫폼으로, 서비스 제공의 직접 당사자는 이용자와 헬퍼입니다. 플랫폼은 서비스 품질 향상을 위해 노력하나, 이용자와 헬퍼 간 분쟁에 대한 직접적인 책임을 지지 않습니다.'],
  ];
  const AGREE_ITEMS = [
    ['content', '서비스 내용 확인', '위에 명시된 서비스명과 서비스 금액을 직접 확인하였습니다.'],
    ['expert', '전문가 배정 확인', '매칭된 전문가 정보(전문가명, 서비스 구분)를 확인하였습니다.'],
    ['payment', '결제 동의', '서비스 금액이 매칭된 전문가에게 지급되는 것에 동의합니다.'],
    ['refund', '환불 규정 확인', '서비스 취소·환불 규정(제4조)을 확인하고 동의합니다.'],
    ['privacy', '개인정보 활용 동의', '서비스 이용 목적의 개인정보 수집·활용에 동의합니다.'],
  ];

  const cState = {
    step: 1,
    agreements: { content: false, expert: false, payment: false, refund: false, privacy: false },
    signatureDataUrl: null,
    signedAt: null,
  };

  const overlay = document.createElement('div');
  overlay.id = 'bm-contract-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:85;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;padding:1rem';
  document.body.appendChild(overlay);

  const close = () => { overlay.remove(); onCancel?.(); };

  const sectionTitle = text => `<div style="font-size:0.8125rem;font-weight:800;color:#374151;margin-bottom:0.5rem">${text}</div>`;
  const infoRows = rows => `
    <div style="background:#f9fafb;border-radius:0.75rem;padding:0.875rem 1rem;display:flex;flex-direction:column;gap:0.5rem">
      ${rows.map(([k, v]) => `<div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">${k}</span><span style="font-weight:700;color:#1a2260">${v}</span></div>`).join('')}
    </div>`;

  function stepIndicatorHtml() {
    return `
      <div style="display:flex;align-items:flex-start;padding:0.75rem 1rem;background:#f9fafb;border-bottom:1px solid #f3f4f6">
        ${STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = cState.step > n;
          const active = cState.step === n;
          const circleColor = done ? '#16a34a' : active ? '#1a2260' : '#d1d5db';
          const textColor = done ? '#16a34a' : active ? '#1a2260' : '#9ca3af';
          const circle = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;width:52px">
              <div style="width:22px;height:22px;border-radius:9999px;background:${circleColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6875rem;font-weight:800">${done ? '✓' : n}</div>
              <span style="font-size:0.5938rem;font-weight:700;color:${textColor};white-space:nowrap">${label}</span>
            </div>`;
          const line = n < STEP_LABELS.length ? `<div style="flex:1;height:2px;background:${done ? '#16a34a' : '#e5e7eb'};margin-top:11px"></div>` : '';
          return circle + line;
        }).join('')}
      </div>`;
  }

  function step1Html() {
    const itemsListHtml = items.map(i => `
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8125rem;padding:6px 0;border-bottom:1px solid #f3f4f6">
        <span style="color:#374151">${escapeHtml(i.svc.name)} <span style="color:#9ca3af">x ${i.qty}</span></span>
        <span style="font-weight:700;color:#1a2260">${comma(i.svc.price * i.qty)}원</span>
      </div>`).join('');

    return `
      <div>
        ${sectionTitle('📋 서비스 정보')}
        ${infoRows([
          ['계약번호', contractNo],
          ['계약일시', contractDate],
          ['서비스 분류', escapeHtml(categoryLabel)],
        ])}
        <div style="margin-top:0.5rem;max-height:120px;overflow-y:auto;background:#fff;border:1px solid #f3f4f6;border-radius:0.5rem;padding:0 0.75rem">${itemsListHtml}</div>
        <div style="margin-top:0.5rem;background:#f9fafb;border-radius:0.75rem;padding:0.75rem 1rem;display:flex;flex-direction:column;gap:0.5rem">
          <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">서비스 금액</span><span style="font-weight:600;color:#1a2260">${comma(subtotal)}원</span></div>
          <div style="display:flex;justify-content:space-between;padding-top:0.5rem;border-top:1px solid #e5e7eb">
            <span style="font-size:0.8125rem;font-weight:700;color:#374151">총 결제금액</span>
            <span style="font-size:1.0625rem;font-weight:800;color:#1a2260">${comma(total)}원</span>
          </div>
        </div>
      </div>

      <div>
        ${sectionTitle('🙋 배정된 전문가 정보')}
        ${infoRows([
          ['전문가명', escapeHtml(expert)],
          ['서비스 구분', `${escapeHtml(categoryLabel)} 전문가`],
          ['배정 상태', '✅ 배정 완료'],
        ])}
      </div>

      <div>
        ${sectionTitle('👤 서비스 이용 회원 정보')}
        ${infoRows([
          ['회원명', escapeHtml(member?.NAME || '회원')],
          ['휴대폰번호', escapeHtml(member?.PHONE ?? '-')],
        ])}
      </div>

      <div>
        ${sectionTitle('📜 계약 조항')}
        <div style="display:flex;flex-direction:column;gap:0.625rem">
          ${CLAUSES.map(([title, body]) => `
            <div>
              <p style="font-size:0.8125rem;font-weight:800;color:#1a2260;margin-bottom:0.25rem">${title}</p>
              <div style="background:#f9fafb;border-radius:0.5rem;padding:0.625rem 0.75rem;font-size:0.75rem;color:#4b5563;line-height:1.6;white-space:pre-line">${body}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function step2Html() {
    const allChecked = AGREE_ITEMS.every(([key]) => cState.agreements[key]);
    return `
      <div>
        ${sectionTitle('✅ 이용자 최종 확인 및 동의')}
        <label style="display:flex;align-items:center;gap:0.5rem;background:#eef1fb;border-radius:0.75rem;padding:0.875rem 1rem;cursor:pointer;margin-bottom:0.625rem">
          <input type="checkbox" id="ctm-agree-all" ${allChecked ? 'checked' : ''} style="width:1.125rem;height:1.125rem;accent-color:#1a2260;cursor:pointer">
          <span style="font-size:0.875rem;font-weight:800;color:#1a2260">아래 항목에 모두 동의합니다</span>
        </label>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          ${AGREE_ITEMS.map(([key, title, desc]) => `
            <label style="display:flex;align-items:flex-start;gap:0.5rem;border:1px solid #e5e7eb;border-radius:0.625rem;padding:0.75rem 0.875rem;cursor:pointer">
              <input type="checkbox" class="ctm-agree-item" data-key="${key}" ${cState.agreements[key] ? 'checked' : ''} style="width:1.125rem;height:1.125rem;margin-top:0.125rem;accent-color:#1a2260;cursor:pointer">
              <span>
                <span style="display:block;font-size:0.8125rem;font-weight:700;color:#1a2260">${title}</span>
                <span style="display:block;font-size:0.75rem;color:#6b7280;margin-top:0.125rem">${desc}</span>
              </span>
            </label>`).join('')}
        </div>
      </div>`;
  }

  function step3Html() {
    return `
      <div>
        ${sectionTitle('✍️ 전자서명')}
        <p style="font-size:0.8125rem;color:#6b7280;line-height:1.6;margin-bottom:0.75rem">아래 서명란에 손가락으로 서명해 주세요.<br>서명 완료 후 계약이 체결됩니다.</p>
        <div style="display:flex;gap:0.625rem;margin-bottom:0.75rem">
          <div style="flex:1;border:1px solid #e5e7eb;border-radius:0.625rem;padding:0.75rem;min-width:0">
            <p style="font-size:0.6875rem;color:#9ca3af;font-weight:700;margin-bottom:0.25rem">이용자 (회원)</p>
            <p style="font-size:0.9375rem;font-weight:800;color:#1a2260;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(member?.NAME || '회원')}</p>
            <p style="font-size:0.75rem;color:#6b7280;margin-top:0.125rem">${escapeHtml(member?.PHONE ?? '-')}</p>
          </div>
          <div style="flex:1;border:1px solid #e5e7eb;border-radius:0.625rem;padding:0.75rem;min-width:0">
            <p style="font-size:0.6875rem;color:#9ca3af;font-weight:700;margin-bottom:0.25rem">서비스 전문가</p>
            <p style="font-size:0.9375rem;font-weight:800;color:#1a2260;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(expert)}</p>
            <p style="font-size:0.75rem;color:#6b7280;margin-top:0.125rem">배정 완료</p>
          </div>
        </div>
        <div style="position:relative;border:2px dashed #d1d5db;border-radius:0.75rem;overflow:hidden;background:#fafafa">
          <canvas id="ctm-sig-canvas" style="width:100%;height:160px;display:block;cursor:crosshair"></canvas>
          <div id="ctm-sig-placeholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.8125rem;color:#9ca3af;pointer-events:none">✍️ 이곳에 서명하세요</div>
        </div>
        <button type="button" id="ctm-sig-reset" style="margin-top:0.5rem;background:none;border:none;color:#6b7280;font-size:0.8125rem;font-weight:600;cursor:pointer">↺ 다시 서명</button>
      </div>`;
  }

  function step4Html() {
    const d = cState.signedAt ?? new Date();
    const signedAtStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} (KST)`;
    return `
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:0.5rem 0 0.25rem">
        <div style="width:52px;height:52px;border-radius:9999px;background:#1a2260;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.625rem;margin-bottom:0.75rem">✓</div>
        <p style="font-size:1.0625rem;font-weight:800;color:#1a2260;margin-bottom:0.375rem">계약서 작성 완료!</p>
        <p style="font-size:0.8125rem;color:#6b7280;line-height:1.6">서비스 이용계약서가 성공적으로 작성되었습니다.<br>배정된 전문가가 서비스를 제공할 예정입니다.</p>
      </div>
      <div style="background:#f9fafb;border-radius:0.75rem;padding:0.875rem 1rem;display:flex;flex-direction:column;gap:0.625rem">
        <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">계약번호</span><span style="font-weight:700;color:#1a2260">${contractNo}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">서비스명</span><span style="font-weight:700;color:#1a2260">${escapeHtml(serviceLabel)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">서비스 금액</span><span style="font-weight:700;color:#1a2260">${comma(total)}원</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">배정 전문가</span><span style="font-weight:700;color:#1a2260">${escapeHtml(expert)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">계약 일시</span><span style="font-weight:700;color:#1a2260">${signedAtStr}</span></div>
        <div>
          <span style="display:block;font-size:0.8125rem;color:#6b7280;margin-bottom:0.375rem">이용자 서명</span>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;padding:0.5rem;display:flex;align-items:center;justify-content:center">
            <img src="${cState.signatureDataUrl}" alt="서명" style="height:56px">
          </div>
        </div>
      </div>`;
  }

  function footerHtml() {
    if (cState.step === 1) {
      return `<button id="ctm-next" class="bm-btn-primary" style="flex:1;height:46px;font-size:0.9375rem">다음 단계</button>`;
    }
    if (cState.step === 2) {
      const allAgreed = AGREE_ITEMS.every(([key]) => cState.agreements[key]);
      return `
        <button id="ctm-prev" class="bm-btn-secondary" style="flex:1;height:46px;font-size:0.9375rem">이전</button>
        <button id="ctm-next" class="bm-btn-primary" style="flex:1;height:46px;font-size:0.9375rem" ${allAgreed ? '' : 'disabled'}>다음 단계</button>`;
    }
    if (cState.step === 3) {
      return `
        <button id="ctm-prev" class="bm-btn-secondary" style="flex:1;height:46px;font-size:0.9375rem">이전</button>
        <button id="ctm-sign" class="bm-btn-primary" style="flex:1;height:46px;font-size:0.9375rem" disabled>✍️ 서명 완료 및 계약 체결</button>`;
    }
    return `<button id="ctm-complete" class="bm-btn-primary" style="flex:1;height:46px;font-size:0.9375rem">💳 결제화면으로 이동</button>`;
  }

  function wire() {
    document.getElementById('ctm-close').addEventListener('click', close);
    document.getElementById('ctm-prev')?.addEventListener('click', () => { cState.step -= 1; render(); });

    if (cState.step === 1) {
      document.getElementById('ctm-next').addEventListener('click', () => { cState.step = 2; render(); });
    } else if (cState.step === 2) {
      const allBox = document.getElementById('ctm-agree-all');
      const itemBoxes = [...document.querySelectorAll('.ctm-agree-item')];
      const nextBtn = document.getElementById('ctm-next');
      const syncNextBtn = () => {
        const allAgreed = AGREE_ITEMS.every(([key]) => cState.agreements[key]);
        nextBtn.disabled = !allAgreed;
        allBox.checked = allAgreed;
      };
      allBox.addEventListener('change', () => {
        const checked = allBox.checked;
        AGREE_ITEMS.forEach(([key]) => { cState.agreements[key] = checked; });
        itemBoxes.forEach(b => { b.checked = checked; });
        syncNextBtn();
      });
      itemBoxes.forEach(box => {
        box.addEventListener('change', () => {
          cState.agreements[box.dataset.key] = box.checked;
          syncNextBtn();
        });
      });
      nextBtn.addEventListener('click', () => {
        if (!AGREE_ITEMS.every(([key]) => cState.agreements[key])) return;
        cState.step = 3; render();
      });
    } else if (cState.step === 3) {
      const canvas = document.getElementById('ctm-sig-canvas');
      const placeholder = document.getElementById('ctm-sig-placeholder');
      const signBtn = document.getElementById('ctm-sign');
      const resetBtn = document.getElementById('ctm-sig-reset');

      const ctx = canvas.getContext('2d');
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.strokeStyle = '#1a2260';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      canvas.style.touchAction = 'none';

      let drawing = false, lastX = 0, lastY = 0, hasSig = false;
      const posOf = e => {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      const setSigState = has => {
        hasSig = has;
        placeholder.style.display = has ? 'none' : 'flex';
        signBtn.disabled = !has;
      };
      canvas.addEventListener('pointerdown', e => {
        drawing = true;
        canvas.setPointerCapture(e.pointerId);
        const p = posOf(e);
        lastX = p.x; lastY = p.y;
        if (!hasSig) setSigState(true);
      });
      canvas.addEventListener('pointermove', e => {
        if (!drawing) return;
        const p = posOf(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        lastX = p.x; lastY = p.y;
      });
      const stopDrawing = () => { drawing = false; };
      canvas.addEventListener('pointerup', stopDrawing);
      canvas.addEventListener('pointercancel', stopDrawing);

      resetBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSigState(false);
      });

      signBtn.addEventListener('click', () => {
        if (!hasSig) return;
        cState.signatureDataUrl = canvas.toDataURL('image/png');
        cState.signedAt = new Date();
        cState.step = 4;
        render();
      });
    } else if (cState.step === 4) {
      document.getElementById('ctm-complete').addEventListener('click', () => {
        overlay.remove();
        onComplete?.();
      });
    }
  }

  function render() {
    overlay.innerHTML = `
      <div style="width:100%;max-width:420px;max-height:90vh;background:#fff;border-radius:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1.125rem;background:#1a2260;color:#fff;flex-shrink:0">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <span style="font-size:0.9375rem;font-weight:800">서비스 이용계약서</span>
          </div>
          <button id="ctm-close" style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.85);font-size:1.25rem;line-height:1">×</button>
        </div>
        ${stepIndicatorHtml()}
        <div style="padding:1.125rem;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:1rem">
          ${cState.step === 1 ? step1Html() : cState.step === 2 ? step2Html() : cState.step === 3 ? step3Html() : step4Html()}
        </div>
        <div style="display:flex;gap:0.5rem;padding:0.875rem 1.125rem;border-top:1px solid #f3f4f6;flex-shrink:0">${footerHtml()}</div>
      </div>`;
    wire();
  }

  render();
}

// ---------- Inicis card payment module (mock KG이니시스 표준결제창) ----------
function openInicisModal({ amount, productLabel, onSuccess, onCancel }) {
  document.getElementById('bm-inicis-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'bm-inicis-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:90;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:1rem';
  document.body.appendChild(overlay);

  const close = () => { overlay.remove(); onCancel?.(); };
  let agreed = false;
  const shell = (innerHtml) => `
    <div style="width:100%;max-width:400px;max-height:92vh;background:#fff;border-radius:1rem;box-shadow:0 12px 40px rgba(0,0,0,0.35);overflow:hidden;display:flex;flex-direction:column">${innerHtml}</div>`;

  function renderSelectStep() {
    overlay.innerHTML = shell(`
      <div style="background:#e11d2e;padding:16px 18px 18px;flex-shrink:0">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:8px">
          <span style="color:#fff;font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">▶ 바로매치 - KG이니시스</span>
          <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
            <span style="color:#fff;font-size:12px;font-weight:800">KG 이니시스</span>
            <button id="inicis-close-1" aria-label="닫기" style="background:none;border:none;color:#fff;font-size:1.15rem;line-height:1;cursor:pointer">×</button>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
          <span style="color:rgba(255,255,255,0.85);font-size:12.5px;font-weight:700">금액</span>
          <span style="color:#fff;font-size:22px;font-weight:800">${comma(amount)}<span style="font-size:14px;font-weight:700">원</span></span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="color:rgba(255,255,255,0.85);font-size:12.5px;font-weight:700">상품명</span>
          <span style="color:#fff;font-size:13px;font-weight:700;max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(productLabel)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:rgba(255,255,255,0.85);font-size:12.5px;font-weight:700">제공기간</span>
          <span style="color:#fff;font-size:13px;font-weight:700">별도 제공 기간 없음</span>
        </div>
      </div>

      <div style="overflow-y:auto;padding:16px 18px;flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <span style="font-size:14px;font-weight:800;color:#1f2937">이용약관</span>
          <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#374151;cursor:pointer">
            전체동의
            <input type="checkbox" id="inicis-agree-all" ${agreed ? 'checked' : ''} style="width:16px;height:16px;accent-color:#1a2260">
          </label>
        </div>
        <div style="padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid #f3f4f6">
          <div style="font-size:12.5px;color:#6b7280;padding:6px 0;text-decoration:underline;text-underline-offset:2px">전자금융거래 이용약관</div>
          <div style="display:flex;gap:14px">
            <label style="flex:1;display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:11.5px;color:#6b7280;padding:6px 0;cursor:pointer">
              개인정보 수집/이용안내
              <input type="checkbox" class="inicis-agree-sub" ${agreed ? 'checked' : ''} style="width:15px;height:15px;accent-color:#1a2260;flex-shrink:0">
            </label>
            <label style="flex:1;display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:11.5px;color:#6b7280;padding:6px 0;cursor:pointer">
              개인정보 제3자 제공/위탁안내
              <input type="checkbox" class="inicis-agree-sub" ${agreed ? 'checked' : ''} style="width:15px;height:15px;accent-color:#1a2260;flex-shrink:0">
            </label>
          </div>
        </div>

        <div style="background:#f3f4f6;border-radius:0.5rem;padding:10px 12px;margin-bottom:12px;font-size:11px;color:#6b7280;line-height:1.6">
          <span style="color:#dc2626;font-weight:800;margin-right:4px">EVENT</span>
          카카오페이 (신한) 1만원 이상 5% 청구 할인 <span style="color:#9ca3af">(최대 3천원, 1인/1일/1회 한정)</span><br>
          PAYCO 1만원 이상 3500원 할인! <span style="color:#9ca3af">(생애 첫 결제시)</span>
        </div>

        <div style="display:flex;border-radius:0.5rem;overflow:hidden;margin-bottom:16px">
          <span style="background:#e11d2e;color:#fff;font-size:11px;font-weight:800;padding:10px 12px;flex-shrink:0;display:flex;align-items:center">롯데카드</span>
          <span style="background:#fde8e8;color:#b91c1c;font-size:11.5px;font-weight:700;padding:10px 12px;flex:1;text-align:center;display:flex;align-items:center;justify-content:center">5만원 이상 2~11개월 무이자 혜택</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
          ${BM_SIMPLE_PAYS.map((name, i) => `
            <button type="button" class="inicis-pay-opt" data-pay="${escapeHtml(name)}" style="${i === 4 ? 'grid-column:1/-1;' : ''}border:1px solid #e5e7eb;border-radius:0.5rem;background:#fff;color:#374151;font-size:13px;font-weight:700;padding:14px 0;cursor:pointer">${escapeHtml(name)}</button>
          `).join('')}
        </div>

        <div style="height:1px;background:#e5e7eb;margin-bottom:14px"></div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${BM_CARD_COMPANIES.map(name => `
            <button type="button" class="inicis-cardco-opt" data-card="${escapeHtml(name)}" style="border:1px solid #e5e7eb;border-radius:0.5rem;background:#fff;color:#374151;font-size:11px;font-weight:700;padding:12px 2px;cursor:pointer">${escapeHtml(name.replace('카드', ''))}</button>
          `).join('')}
          <button type="button" id="inicis-more-btn" style="border:1px solid #e5e7eb;border-radius:0.5rem;background:#fff;color:#9ca3af;font-size:11px;font-weight:700;padding:12px 2px;cursor:pointer">더보기+</button>
        </div>
      </div>`);

    document.getElementById('inicis-close-1').addEventListener('click', close);

    const agreeAll = document.getElementById('inicis-agree-all');
    const subs = [...overlay.querySelectorAll('.inicis-agree-sub')];
    agreeAll.addEventListener('change', () => { subs.forEach(s => { s.checked = agreeAll.checked; }); agreed = agreeAll.checked; });
    subs.forEach(s => s.addEventListener('change', () => { agreeAll.checked = subs.every(x => x.checked); agreed = agreeAll.checked; }));

    function requireAgreement() {
      if (!subs.every(s => s.checked)) { showBmAlert('이용약관에 동의해 주세요.'); return false; }
      return true;
    }

    overlay.querySelectorAll('.inicis-pay-opt').forEach(btn => btn.addEventListener('click', () => {
      if (!requireAgreement()) return;
      renderProcessing(btn.dataset.pay, () => onSuccess?.({ cardCompany: btn.dataset.pay, installment: '일시불' }));
    }));
    overlay.querySelectorAll('.inicis-cardco-opt').forEach(btn => btn.addEventListener('click', () => {
      if (!requireAgreement()) return;
      renderCardStep(btn.dataset.card);
    }));
    document.getElementById('inicis-more-btn').addEventListener('click', () => showBmToast('추가 카드사 목록은 준비 중입니다.'));
  }

  function renderCardStep(cardName) {
    overlay.innerHTML = shell(`
      <div style="background:#e11d2e;padding:14px 18px;display:flex;align-items:center;gap:10px;flex-shrink:0">
        <button id="inicis-back" aria-label="뒤로" style="background:none;border:none;color:#fff;cursor:pointer;display:flex;padding:0;flex-shrink:0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span style="color:#fff;font-size:13.5px;font-weight:800;flex:1">${escapeHtml(cardName)} 카드결제</span>
        <button id="inicis-close-2" aria-label="닫기" style="background:none;border:none;color:#fff;font-size:1.15rem;line-height:1;cursor:pointer;flex-shrink:0">×</button>
      </div>

      <div style="overflow-y:auto;padding:18px;flex:1">
        <div style="background:#f9fafb;border-radius:0.75rem;padding:14px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12.5px;color:#6b7280;font-weight:600">결제금액</span>
          <span style="font-size:19px;font-weight:800;color:#1a2260">${comma(amount)}원</span>
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
        <select id="inicis-installment" class="bm-field" style="height:2.5rem">
          ${BM_INSTALLMENTS.map(v => `<option value="${v}">${v}</option>`).join('')}
        </select>
      </div>

      <div style="padding:14px 18px;border-top:1px solid #f3f4f6;flex-shrink:0">
        <button id="inicis-pay-btn" class="bm-btn-primary" style="width:100%;height:48px;font-size:15px" disabled>${comma(amount)}원 결제하기</button>
      </div>`);

    document.getElementById('inicis-close-2').addEventListener('click', close);
    document.getElementById('inicis-back').addEventListener('click', renderSelectStep);

    const numInputs = [...overlay.querySelectorAll('.inicis-card-num')];
    const mmInput = document.getElementById('inicis-exp-mm');
    const yyInput = document.getElementById('inicis-exp-yy');
    const pwdInput = document.getElementById('inicis-pwd');
    const payBtn = document.getElementById('inicis-pay-btn');

    function refreshValidity() {
      const numsFilled = numInputs.every(inp => inp.value.length === 4);
      payBtn.disabled = !(numsFilled && mmInput.value.length === 2 && yyInput.value.length === 2 && pwdInput.value.length === 2);
    }

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

    payBtn.addEventListener('click', () => {
      const installment = document.getElementById('inicis-installment').value;
      renderProcessing(cardName, () => onSuccess?.({ cardCompany: cardName, installment }));
    });
  }

  function renderProcessing(label, onDone) {
    overlay.innerHTML = shell(`
      <div style="padding:56px 24px;display:flex;flex-direction:column;align-items:center;gap:16px">
        <div style="width:34px;height:34px;border:3px solid #f3f4f6;border-top-color:#e11d2e;border-radius:50%;animation:bm-spin 0.7s linear infinite"></div>
        <p style="font-size:13.5px;color:#4b5563;font-weight:600">${escapeHtml(label)}(으)로 결제 처리 중입니다...</p>
      </div>`);
    setTimeout(() => { overlay.remove(); onDone(); }, 900);
  }

  renderSelectStep();
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
