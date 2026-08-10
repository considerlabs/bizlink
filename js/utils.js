const MOCK_LOGGED_IN_KEY  = 'MOCK_LOGGED_IN';
const MOCK_BASKET_KEY     = 'MOCK_BASKET_V2';
const FAVORITE_VENDORS_KEY = 'ONIONON_FAVORITE_VENDORS';
const MOCK_NEW_ORDERS_KEY = 'MOCK_NEW_ORDERS_V1';
const STATEMENT_REGISTERED_KEY = 'MOCK_STATEMENT_REGISTERED_V1';
const PLATFORM_FEE_RATE   = 0.055;

function comma(n) {
  return Number(n).toLocaleString('ko-KR');
}

function toDateStr(d) {
  return (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isLoggedIn() {
  return localStorage.getItem(MOCK_LOGGED_IN_KEY) === 'true';
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function getStoreInfo() {
  return { ...MOCK_STORE_INFO };
}

const MOCK_CARDS_KEY = 'MOCK_CARDS_V1';

function getCards() {
  const stored = localStorage.getItem(MOCK_CARDS_KEY);
  if (stored) return JSON.parse(stored);
  const info = getStoreInfo();
  const seed = info.CARD_NO ? [{ no: info.CARD_NO, owner: info.BIZ_OWNER }] : [];
  localStorage.setItem(MOCK_CARDS_KEY, JSON.stringify(seed));
  return seed;
}

function saveCards(cards) {
  localStorage.setItem(MOCK_CARDS_KEY, JSON.stringify(cards));
}

function getBasket() {
  const stored = localStorage.getItem(MOCK_BASKET_KEY);
  if (stored) return JSON.parse(stored);
  const items = JSON.parse(JSON.stringify(MOCK_BASKET_ITEMS));
  localStorage.setItem(MOCK_BASKET_KEY, JSON.stringify(items));
  return items;
}

function saveBasket(items) {
  localStorage.setItem(MOCK_BASKET_KEY, JSON.stringify(items));
}

// Orders actually placed during this session (mock data itself is static,
// so newly submitted orders are layered on top via localStorage instead).
function getNewOrders() {
  const stored = localStorage.getItem(MOCK_NEW_ORDERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveNewOrders(entries) {
  localStorage.setItem(MOCK_NEW_ORDERS_KEY, JSON.stringify(entries));
}

// Order numbers whose 거래명세표 has been registered this session (mock
// order data itself is static, so registrations are layered on via localStorage).
function getRegisteredStatements() {
  const stored = localStorage.getItem(STATEMENT_REGISTERED_KEY);
  return stored ? JSON.parse(stored) : [];
}

function markStatementRegistered(orderNo) {
  const list = getRegisteredStatements();
  if (!list.includes(orderNo)) {
    list.push(orderNo);
    localStorage.setItem(STATEMENT_REGISTERED_KEY, JSON.stringify(list));
  }
}

function getCartCount() {
  return getBasket().length;
}

function getFavoriteVendors() {
  const stored = localStorage.getItem(FAVORITE_VENDORS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveFavoriteVendors(list) {
  localStorage.setItem(FAVORITE_VENDORS_KEY, JSON.stringify(list));
}

function showAlert(message, onClose) {
  document.getElementById('alert-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'alert-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);padding:1rem';
  modal.innerHTML = `
    <div style="width:100%;max-width:360px;background:#fff;border-radius:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden">
      <div style="padding:1.5rem 1.5rem 1rem">
        <p style="font-size:0.875rem;color:#1a2260;line-height:1.6;white-space:pre-line">${escapeHtml(message)}</p>
      </div>
      <div style="display:flex;justify-content:flex-end;padding:0 1.5rem 1.25rem">
        <button id="alert-ok-btn" class="btn-primary" style="padding:0.5rem 1.5rem;font-size:0.875rem">확인</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const close = () => { modal.remove(); onClose?.(); };
  document.getElementById('alert-ok-btn').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
}

function showConfirm(message, onYes) {
  document.getElementById('confirm-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'confirm-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);padding:1rem';
  modal.innerHTML = `
    <div style="width:100%;max-width:360px;background:#fff;border-radius:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden">
      <div style="padding:1.5rem 1.5rem 1rem">
        <p style="font-size:0.875rem;color:#1a2260;line-height:1.6;white-space:pre-line;text-align:center">${escapeHtml(message)}</p>
      </div>
      <div style="display:flex;gap:0.625rem;padding:0 1.5rem 1.25rem">
        <button id="confirm-no-btn" class="btn-secondary" style="flex:1;padding:0.625rem 0;font-size:0.875rem">아니오</button>
        <button id="confirm-yes-btn" class="btn-primary" style="flex:1;padding:0.625rem 0;font-size:0.875rem">예</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  document.getElementById('confirm-no-btn').addEventListener('click', close);
  document.getElementById('confirm-yes-btn').addEventListener('click', () => { modal.remove(); onYes?.(); });
}

function showPaymentModal({ vendor, subtotal, platformFee, paymentTotal, storeInfo, onClose, onConfirm }) {
  document.getElementById('payment-modal')?.remove();
  const cards = getCards();
  const modal = document.createElement('div');
  modal.id = 'payment-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);padding:1rem';
  modal.innerHTML = `
    <div style="width:100%;max-width:460px;background:#fff;border-radius:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #f3f4f6">
        <div style="display:flex;align-items:center;gap:0.5rem">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B3990" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          <span style="font-size:0.875rem;font-weight:800;color:#1a2260">결제 확인</span>
        </div>
        <button id="pm-close" style="background:none;border:none;cursor:pointer;color:#9ca3af;font-size:1.25rem;line-height:1">×</button>
      </div>
      <div style="padding:1rem 1.25rem;display:flex;flex-direction:column;gap:1rem">

        <div>
          <div style="display:flex;align-items:center;gap:0.375rem;margin-bottom:0.5rem">
            <span style="display:flex;align-items:center;justify-content:center;width:1.25rem;height:1.25rem;border-radius:0.25rem;background:#eef0f9;color:#2B3990">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </span>
            <span style="font-size:0.875rem;font-weight:800;color:#374151">공급자 정보</span>
          </div>
          <div style="background:#f9fafb;border-radius:0.75rem;padding:0.875rem 1rem;display:flex;flex-direction:column;gap:0.625rem">
            ${['공급자명:' + (vendor?.VENDOR_NM ?? '-'), '사업자번호:' + (vendor?.BIZ_NUM ?? '-'), '대표자:' + (vendor?.REP_NAME ?? '-'), '연락처:' + (vendor?.CONTACT ?? '-')].map(r => {
              const [k, v] = r.split(':');
              return `<div style="display:flex;justify-content:space-between;font-size:0.9375rem"><span style="color:#6b7280">${k}</span><span style="font-weight:600;color:#1a2260">${v}</span></div>`;
            }).join('')}
          </div>
          <label style="display:flex;align-items:center;gap:0.375rem;margin-top:0.5rem;cursor:pointer">
            <input type="checkbox" id="pm-vendor-confirm" style="width:1.125rem;height:1.125rem;accent-color:#2B3990;cursor:pointer">
            <span style="font-size:0.875rem;color:#374151">공급자 정보를 확인했습니다.</span>
          </label>
        </div>

        <div>
          <div style="display:flex;align-items:center;gap:0.375rem;margin-bottom:0.5rem">
            <span style="display:flex;align-items:center;justify-content:center;width:1.25rem;height:1.25rem;border-radius:0.25rem;background:#eef0f9;color:#2B3990">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/></svg>
            </span>
            <span style="font-size:0.75rem;font-weight:800;color:#374151">결제 금액</span>
          </div>
          <div style="background:#f9fafb;border-radius:0.75rem;padding:0.75rem 1rem;display:flex;flex-direction:column;gap:0.5rem">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem"><span style="color:#6b7280">상품금액</span><span style="font-weight:600;color:#1a2260">${comma(subtotal)}원</span></div>
            <div style="display:flex;justify-content:space-between;font-size:0.75rem"><span style="color:#6b7280">물류주수수료 (5.5%)</span><span style="font-weight:600;color:#1a2260">${comma(platformFee)}원</span></div>
            <div style="display:flex;justify-content:space-between;padding-top:0.5rem;border-top:1px solid #e5e7eb">
              <span style="font-size:0.75rem;font-weight:700;color:#374151">최종 결제금액</span>
              <span style="font-size:1.125rem;font-weight:800;color:#2B3990">${comma(paymentTotal)}원</span>
            </div>
          </div>
        </div>

        <div>
          <div style="display:flex;align-items:center;gap:0.375rem;margin-bottom:0.5rem">
            <span style="display:flex;align-items:center;justify-content:center;width:1.25rem;height:1.25rem;border-radius:0.25rem;background:#eef0f9;color:#2B3990">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </span>
            <span style="font-size:0.75rem;font-weight:800;color:#374151">결제 카드 선택</span>
          </div>
          ${cards.length ? `
          <style>
            #pm-card-list::-webkit-scrollbar{display:none}
            #pm-card-prev:disabled,#pm-card-next:disabled{background:#d1d5db;box-shadow:none;cursor:default}
          </style>
          <div style="background:#f9fafb;border-radius:0.75rem;padding:0.75rem 1rem;position:relative">
            <button type="button" id="pm-card-prev" aria-label="이전 카드" style="position:absolute;top:50%;left:2px;transform:translateY(-50%);width:26px;height:26px;border-radius:9999px;border:none;background:#2B3990;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(43,57,144,0.35);z-index:2;transition:background 0.15s"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
            <div id="pm-card-list" style="display:flex;gap:0.625rem;overflow-x:auto;scroll-behavior:smooth;scrollbar-width:none;margin:0 34px">
              ${cards.map((c, i) => {
                const [l1, l2] = [c.no.split('-').slice(0, 2).join(' '), c.no.split('-').slice(2).join(' ')];
                return `
                <button type="button" class="pm-card-option" data-idx="${i}" style="flex:0 0 auto;border:none;background:none;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px">
                  <span class="pm-card-visual" style="width:88px;height:54px;border-radius:0.75rem;background:linear-gradient(135deg,#3b82f6,#1e40af);padding:0.5rem 0.75rem;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 6px rgba(0,0,0,0.15);box-sizing:border-box;outline-offset:2px;transition:filter 0.15s,outline 0.15s">
                    <span style="font-size:9px;font-weight:700;font-style:italic;color:rgba(255,255,255,0.8);letter-spacing:0.05em">VISA</span>
                    <span style="font-size:9px;color:#fff;font-family:monospace;letter-spacing:0.05em;line-height:1.3">${escapeHtml(l1)}<br>${escapeHtml(l2)}</span>
                  </span>
                  <span style="font-size:10px;color:#6b7280;max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(c.owner || '')}</span>
                </button>`;
              }).join('')}
            </div>
            <button type="button" id="pm-card-next" aria-label="다음 카드" style="position:absolute;top:50%;right:2px;transform:translateY(-50%);width:26px;height:26px;border-radius:9999px;border:none;background:#2B3990;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(43,57,144,0.35);z-index:2;transition:background 0.15s"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>` : `
          <div style="background:#f9fafb;border-radius:0.75rem;padding:0.75rem 1rem">
            <p style="font-size:0.8125rem;color:#6b7280">등록된 결제카드가 없습니다.</p>
          </div>`}
        </div>

        <div>
          <div style="display:flex;align-items:center;gap:0.375rem;margin-bottom:0.5rem">
            <span style="display:flex;align-items:center;justify-content:center;width:1.25rem;height:1.25rem;border-radius:0.25rem;background:#eef0f9;color:#2B3990">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </span>
            <span style="font-size:0.75rem;font-weight:800;color:#374151">할부 개월</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem">
            <span style="font-size:0.75rem;color:#6b7280;width:2.5rem;flex-shrink:0">할부</span>
            <select id="pm-installment" style="flex:1;border:1px solid #e5e7eb;border-radius:0.5rem;padding:0 0.75rem;height:2.25rem;font-size:0.875rem;color:#1a2260;background:#fff;outline:none">
              <option>일시불</option><option>2개월</option><option>3개월</option><option>6개월</option><option>12개월</option>
            </select>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:0.625rem;padding:0 1.25rem 1.25rem">
        <button id="pm-cancel" style="flex:1;border-radius:0.75rem;border:1px solid #e5e7eb;padding:0.625rem 0;font-size:0.875rem;font-weight:700;color:#4b5563;background:#fff;cursor:pointer">닫기</button>
        <button id="pm-confirm" class="btn-primary" style="flex:1;border-radius:0.75rem;padding:0.625rem 0;font-size:0.875rem;opacity:0.4;cursor:not-allowed" disabled>결제하기</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const close = () => { modal.remove(); onClose?.(); };
  document.getElementById('pm-close').addEventListener('click', close);
  document.getElementById('pm-cancel').addEventListener('click', close);

  let selectedCardIdx = 0;
  const cardOptionBtns = modal.querySelectorAll('.pm-card-option');
  const applyCardSelection = idx => {
    cardOptionBtns.forEach(btn => {
      const visual = btn.querySelector('.pm-card-visual');
      const selected = Number(btn.dataset.idx) === idx;
      visual.style.filter = selected ? 'invert(1)' : 'none';
      visual.style.outline = selected ? '2px solid #2B3990' : 'none';
    });
  };
  if (cards.length) applyCardSelection(selectedCardIdx);
  cardOptionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCardIdx = Number(btn.dataset.idx);
      applyCardSelection(selectedCardIdx);
    });
  });

  const cardTrack = document.getElementById('pm-card-list');
  const cardPrevBtn = document.getElementById('pm-card-prev');
  const cardNextBtn = document.getElementById('pm-card-next');
  if (cardTrack) {
    const refreshCardArrows = () => {
      cardPrevBtn.disabled = cardTrack.scrollLeft <= 4;
      cardNextBtn.disabled = cardTrack.scrollLeft >= cardTrack.scrollWidth - cardTrack.clientWidth - 4;
    };
    cardPrevBtn.addEventListener('click', () => cardTrack.scrollBy({ left: -98, behavior: 'smooth' }));
    cardNextBtn.addEventListener('click', () => cardTrack.scrollBy({ left: 98, behavior: 'smooth' }));
    cardTrack.addEventListener('scroll', refreshCardArrows);
    refreshCardArrows();
  }

  const confirmBtn = document.getElementById('pm-confirm');
  document.getElementById('pm-vendor-confirm').addEventListener('change', e => {
    confirmBtn.disabled = !e.target.checked;
    confirmBtn.style.opacity = e.target.checked ? '1' : '0.4';
    confirmBtn.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
  });

  confirmBtn.addEventListener('click', () => {
    const installment = document.getElementById('pm-installment').value;
    const selectedCard = cards[selectedCardIdx] ?? null;
    modal.remove();
    onConfirm?.(installment, selectedCard);
  });
}

function showContractModal({ vendor, storeInfo, items, subtotal, platformFee, paymentTotal, onComplete, onCancel }) {
  document.getElementById('contract-modal')?.remove();

  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  const contractNo = `CTR-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
  const contractDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const STEP_LABELS = ['계약 확인', '동의', '서명', '완료'];
  const CLAUSES = [
    ['제1조 (계약 목적)', '본 계약은 비즈링크 플랫폼을 통해 이용자와 공급자 간에 체결되는 상품 구매 거래에 관한 사항을 정하며, 상호 합의된 거래임을 확인하기 위해 작성됩니다.'],
    ['제2조 (주문 내용 및 금액)', '이용자는 상단에 명시된 주문상품을 공급자로부터 공급받으며, 주문금액 및 플랫폼수수료를 확인하고 결제에 동의합니다. 주문금액은 계약서 상단에 표기된 금액을 기준으로 합니다.'],
    ['제3조 (결제 조건)', '이용자는 본 계약서에 전자서명 완료 후 결제를 진행합니다. 결제 완료 후 주문금액은 비즈링크 플랫폼을 통해 공급자에게 정산됩니다.'],
    ['제4조 (환불 및 취소 규정)', '1. 상품 발송 전 취소 시 전액 환불됩니다.\n2. 상품 발송 이후 취소·환불은 공급자 동의가 있는 경우에 한합니다.\n3. 단순 변심에 의한 취소는 플랫폼 운영정책에 따릅니다.'],
    ['제5조 (개인정보 및 기록 보관)', '전자서명 기록 및 결제 기록은 관련 법령에 따라 보관되며, 분쟁 발생 시 증빙 자료로 활용될 수 있습니다. 이용자의 개인정보는 비즈링크 개인정보처리방침에 따라 처리됩니다.'],
    ['제6조 (플랫폼 중개 서비스)', '비즈링크는 이용자와 공급자 간 상품 구매를 중개하는 플랫폼으로, 거래의 직접 당사자는 이용자와 공급자입니다. 플랫폼은 서비스 품질 향상을 위해 노력하나 양측 간 분쟁에 대한 직접적인 책임을 지지 않습니다.'],
  ];
  const AGREE_ITEMS = [
    ['content', '주문 내용 확인', '위에 명시된 주문상품과 주문금액을 직접 확인하였습니다.'],
    ['vendor', '공급자 정보 확인', '공급자 정보(상호, 사업자번호)를 확인하였습니다.'],
    ['payment', '결제 동의', '주문금액이 공급자에게 정산되는 것에 동의합니다.'],
    ['refund', '환불 규정 확인', '상품 취소·환불 규정(제4조)을 확인하고 동의합니다.'],
    ['privacy', '개인정보 활용 동의', '거래 목적의 개인정보 수집·활용에 동의합니다.'],
  ];

  const cState = {
    step: 1,
    agreements: { content: false, vendor: false, payment: false, refund: false, privacy: false },
    signatureDataUrl: null,
    signedAt: null,
  };

  const modal = document.createElement('div');
  modal.id = 'contract-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);padding:1rem';
  document.body.appendChild(modal);

  const close = () => { modal.remove(); onCancel?.(); };

  const sectionTitle = text => `<div style="font-size:0.8125rem;font-weight:800;color:#374151;margin-bottom:0.5rem">${text}</div>`;
  const infoRows = rows => `
    <div style="background:#f9fafb;border-radius:0.75rem;padding:0.875rem 1rem;display:flex;flex-direction:column;gap:0.5rem">
      ${rows.map(([k, v]) => `<div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">${k}</span><span style="font-weight:700;color:#1a2260">${v}</span></div>`).join('')}
    </div>`;

  function stepIndicatorHtml() {
    return `
      <div style="display:flex;align-items:flex-start;padding:0.875rem 1.25rem;background:#f9fafb;border-bottom:1px solid #f3f4f6">
        ${STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = cState.step > n;
          const active = cState.step === n;
          const circleColor = done ? '#22c55e' : active ? '#2B3990' : '#d1d5db';
          const textColor = done ? '#22c55e' : active ? '#2B3990' : '#9ca3af';
          const circle = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;width:56px">
              <div style="width:24px;height:24px;border-radius:9999px;background:${circleColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800">${done ? '✓' : n}</div>
              <span style="font-size:0.625rem;font-weight:700;color:${textColor};white-space:nowrap">${label}</span>
            </div>`;
          const line = n < STEP_LABELS.length ? `<div style="flex:1;height:2px;background:${done ? '#22c55e' : '#e5e7eb'};margin-top:12px"></div>` : '';
          return circle + line;
        }).join('')}
      </div>`;
  }

  function step1Html() {
    const itemsListHtml = items.map(it => `
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8125rem;padding:6px 0;border-bottom:1px solid #f3f4f6">
        <span style="color:#374151">${escapeHtml(it.GOODS_NM)} <span style="color:#9ca3af">x ${it.ORDER_QTY}</span></span>
        <span style="font-weight:700;color:#1a2260">${comma(it.TOTAL_PRICE)}원</span>
      </div>`).join('');

    return `
      <div>
        ${sectionTitle('📋 주문 정보')}
        ${infoRows([
          ['계약번호', contractNo],
          ['계약일시', contractDate],
          ['공급처', escapeHtml(vendor?.VENDOR_NM ?? '-')],
        ])}
        <div style="margin-top:0.5rem;max-height:140px;overflow-y:auto;background:#fff;border:1px solid #f3f4f6;border-radius:0.5rem;padding:0 0.75rem">${itemsListHtml}</div>
        <div style="margin-top:0.5rem;background:#f9fafb;border-radius:0.75rem;padding:0.75rem 1rem;display:flex;flex-direction:column;gap:0.5rem">
          <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">주문금액</span><span style="font-weight:600;color:#1a2260">${comma(subtotal)}원</span></div>
          <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">플랫폼수수료 (5.5%)</span><span style="font-weight:600;color:#1a2260">${comma(platformFee)}원</span></div>
          <div style="display:flex;justify-content:space-between;padding-top:0.5rem;border-top:1px solid #e5e7eb">
            <span style="font-size:0.8125rem;font-weight:700;color:#374151">결제금액</span>
            <span style="font-size:1.0625rem;font-weight:800;color:#2B3990">${comma(paymentTotal)}원</span>
          </div>
        </div>
      </div>

      <div>
        ${sectionTitle('🏢 공급자 정보')}
        ${infoRows([
          ['공급자명', escapeHtml(vendor?.VENDOR_NM ?? '-')],
          ['사업자번호', escapeHtml(vendor?.BIZ_NUM ?? '-')],
          ['대표자', escapeHtml(vendor?.REP_NAME ?? '-')],
          ['연락처', escapeHtml(vendor?.CONTACT ?? '-')],
        ])}
      </div>

      <div>
        ${sectionTitle('👤 이용자 정보')}
        ${infoRows([
          ['상호', escapeHtml(storeInfo?.BIZ_NAME ?? '-')],
          ['사업자번호', escapeHtml(storeInfo?.BIZ_NUM ?? '-')],
          ['대표자', escapeHtml(storeInfo?.BIZ_OWNER ?? '-')],
          ['연락처', escapeHtml(storeInfo?.BIZ_TEL ?? '-')],
        ])}
      </div>

      <div>
        ${sectionTitle('📜 계약 조항')}
        <div style="display:flex;flex-direction:column;gap:0.625rem">
          ${CLAUSES.map(([title, body]) => `
            <div>
              <p style="font-size:0.8125rem;font-weight:800;color:#2B3990;margin-bottom:0.25rem">${title}</p>
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
        <label style="display:flex;align-items:center;gap:0.5rem;background:#eef0f9;border-radius:0.75rem;padding:0.875rem 1rem;cursor:pointer;margin-bottom:0.625rem">
          <input type="checkbox" id="ctm-agree-all" ${allChecked ? 'checked' : ''} style="width:1.125rem;height:1.125rem;accent-color:#2B3990;cursor:pointer">
          <span style="font-size:0.875rem;font-weight:800;color:#1a2260">아래 항목에 모두 동의합니다</span>
        </label>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          ${AGREE_ITEMS.map(([key, title, desc]) => `
            <label style="display:flex;align-items:flex-start;gap:0.5rem;border:1px solid #e5e7eb;border-radius:0.625rem;padding:0.75rem 0.875rem;cursor:pointer">
              <input type="checkbox" class="ctm-agree-item" data-key="${key}" ${cState.agreements[key] ? 'checked' : ''} style="width:1.125rem;height:1.125rem;margin-top:0.125rem;accent-color:#2B3990;cursor:pointer">
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
        <p style="font-size:0.8125rem;color:#6b7280;line-height:1.6;margin-bottom:0.75rem">아래 서명란에 마우스 또는 손가락으로 서명해 주세요.<br>서명 완료 후 계약이 체결됩니다.</p>
        <div style="display:flex;gap:0.625rem;margin-bottom:0.75rem">
          <div style="flex:1;border:1px solid #e5e7eb;border-radius:0.625rem;padding:0.75rem;min-width:0">
            <p style="font-size:0.6875rem;color:#9ca3af;font-weight:700;margin-bottom:0.25rem">이용자 (구매자)</p>
            <p style="font-size:0.9375rem;font-weight:800;color:#1a2260;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(storeInfo?.BIZ_NAME ?? '-')}</p>
            <p style="font-size:0.75rem;color:#6b7280;margin-top:0.125rem">${escapeHtml(storeInfo?.BIZ_TEL ?? '-')}</p>
          </div>
          <div style="flex:1;border:1px solid #e5e7eb;border-radius:0.625rem;padding:0.75rem;min-width:0">
            <p style="font-size:0.6875rem;color:#9ca3af;font-weight:700;margin-bottom:0.25rem">공급자</p>
            <p style="font-size:0.9375rem;font-weight:800;color:#1a2260;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(vendor?.VENDOR_NM ?? '-')}</p>
            <p style="font-size:0.75rem;color:#6b7280;margin-top:0.125rem">${escapeHtml(vendor?.REP_NAME ?? '-')}</p>
          </div>
        </div>
        <div style="position:relative;border:2px dashed #d1d5db;border-radius:0.75rem;overflow:hidden;background:#fafafa">
          <canvas id="ctm-sig-canvas" style="width:100%;height:180px;display:block;cursor:crosshair"></canvas>
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
        <div style="width:56px;height:56px;border-radius:9999px;background:#2B3990;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.75rem;margin-bottom:0.875rem">✓</div>
        <p style="font-size:1.0625rem;font-weight:800;color:#1a2260;margin-bottom:0.375rem">계약서 작성 완료!</p>
        <p style="font-size:0.8125rem;color:#6b7280;line-height:1.6">구매대행 계약서가 성공적으로 작성되었습니다.<br>서명 완료 후 결제를 진행해 주세요.</p>
      </div>
      <div style="background:#f9fafb;border-radius:0.75rem;padding:0.875rem 1rem;display:flex;flex-direction:column;gap:0.625rem">
        <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">계약번호</span><span style="font-weight:700;color:#1a2260">${contractNo}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">공급처</span><span style="font-weight:700;color:#1a2260">${escapeHtml(vendor?.VENDOR_NM ?? '-')}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">결제금액</span><span style="font-weight:700;color:#1a2260">${comma(paymentTotal)}원</span></div>
        <div style="display:flex;justify-content:space-between;font-size:0.8125rem"><span style="color:#6b7280">계약 일시</span><span style="font-weight:700;color:#1a2260">${signedAtStr}</span></div>
        <div>
          <span style="display:block;font-size:0.8125rem;color:#6b7280;margin-bottom:0.375rem">이용자 서명</span>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;padding:0.5rem;display:flex;align-items:center;justify-content:center">
            <img src="${cState.signatureDataUrl}" alt="서명" style="height:60px">
          </div>
        </div>
      </div>`;
  }

  function footerHtml() {
    if (cState.step === 1) {
      return `<button id="ctm-next" class="btn-primary" style="flex:1;border-radius:0.75rem;padding:0.75rem 0;font-size:0.9375rem">다음 단계</button>`;
    }
    if (cState.step === 2) {
      const allAgreed = AGREE_ITEMS.every(([key]) => cState.agreements[key]);
      return `
        <button id="ctm-prev" style="flex:1;border-radius:0.75rem;border:1px solid #e5e7eb;padding:0.75rem 0;font-size:0.9375rem;font-weight:700;color:#4b5563;background:#fff;cursor:pointer">이전</button>
        <button id="ctm-next" class="btn-primary" style="flex:1;border-radius:0.75rem;padding:0.75rem 0;font-size:0.9375rem;${allAgreed ? '' : 'opacity:0.4;cursor:not-allowed'}" ${allAgreed ? '' : 'disabled'}>다음 단계</button>`;
    }
    if (cState.step === 3) {
      return `
        <button id="ctm-prev" style="flex:1;border-radius:0.75rem;border:1px solid #e5e7eb;padding:0.75rem 0;font-size:0.9375rem;font-weight:700;color:#4b5563;background:#fff;cursor:pointer">이전</button>
        <button id="ctm-sign" class="btn-primary" style="flex:1;border-radius:0.75rem;padding:0.75rem 0;font-size:0.9375rem;opacity:0.4;cursor:not-allowed" disabled>✍️ 서명 완료 및 계약 체결</button>`;
    }
    return `<button id="ctm-complete" class="btn-primary" style="flex:1;border-radius:0.75rem;padding:0.75rem 0;font-size:0.9375rem">💳 결제화면으로 이동</button>`;
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
        nextBtn.style.opacity = allAgreed ? '1' : '0.4';
        nextBtn.style.cursor = allAgreed ? 'pointer' : 'not-allowed';
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
        signBtn.style.opacity = has ? '1' : '0.4';
        signBtn.style.cursor = has ? 'pointer' : 'not-allowed';
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
        modal.remove();
        onComplete?.();
      });
    }
  }

  function render() {
    modal.innerHTML = `
      <div style="width:100%;max-width:480px;max-height:90vh;background:#fff;border-radius:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;background:#2B3990;color:#fff;flex-shrink:0">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <span style="font-size:0.9375rem;font-weight:800">구매대행 계약서</span>
          </div>
          <button id="ctm-close" style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.85);font-size:1.25rem;line-height:1">×</button>
        </div>
        ${stepIndicatorHtml()}
        <div style="padding:1.25rem;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:1rem">
          ${cState.step === 1 ? step1Html() : cState.step === 2 ? step2Html() : cState.step === 3 ? step3Html() : step4Html()}
        </div>
        <div style="display:flex;gap:0.625rem;padding:1rem 1.25rem;border-top:1px solid #f3f4f6;flex-shrink:0">${footerHtml()}</div>
      </div>`;
    wire();
  }

  render();
}

function showCardModal(onGoMyinfo) {
  document.getElementById('card-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'card-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);padding:1rem';
  modal.innerHTML = `
    <div style="width:100%;max-width:400px;background:#fff;border-radius:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.5rem;border-bottom:1px solid #f3f4f6">
        <div style="display:flex;align-items:center;gap:0.5rem">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          <span style="font-size:0.875rem;font-weight:800;color:#1a2260">카드 등록 필요</span>
        </div>
        <button id="cm-close" style="background:none;border:none;cursor:pointer;color:#9ca3af;font-size:1.25rem;line-height:1">×</button>
      </div>
      <div style="padding:1.5rem">
        <p style="font-size:0.875rem;color:#4b5563;line-height:1.6">등록된 결제카드가 없습니다.<br>결제를 진행하려면 먼저 <strong style="color:#1a2260">내정보</strong>에서 카드를 등록해 주세요.</p>
      </div>
      <div style="display:flex;gap:0.5rem;padding:0 1.5rem 1.25rem">
        <button id="cm-cancel" style="flex:1;border-radius:0.75rem;border:1px solid #e5e7eb;padding:0.625rem;font-size:0.875rem;font-weight:700;color:#4b5563;background:#fff;cursor:pointer">취소</button>
        <a href="myinfo.html" class="btn-primary" style="flex:1;border-radius:0.75rem;padding:0.625rem;font-size:0.875rem;text-align:center">카드 등록하기</a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  document.getElementById('cm-close').addEventListener('click', close);
  document.getElementById('cm-cancel').addEventListener('click', close);
}
