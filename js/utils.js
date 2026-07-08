const MOCK_LOGGED_IN_KEY  = 'MOCK_LOGGED_IN';
const MOCK_BASKET_KEY     = 'MOCK_BASKET_V2';
const FAVORITE_VENDORS_KEY = 'ONIONON_FAVORITE_VENDORS';
const MOCK_NEW_ORDERS_KEY = 'MOCK_NEW_ORDERS_V1';
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
            <span style="font-size:0.75rem;font-weight:800;color:#374151">공급자 정보</span>
          </div>
          <div style="background:#f9fafb;border-radius:0.75rem;padding:0.75rem 1rem;display:flex;flex-direction:column;gap:0.5rem">
            ${['공급자명:' + (vendor?.VENDOR_NM ?? '-'), '사업자번호:' + (vendor?.BIZ_NUM ?? '-'), '대표자:' + (vendor?.REP_NAME ?? '-'), '연락처:' + (vendor?.CONTACT ?? '-')].map(r => {
              const [k, v] = r.split(':');
              return `<div style="display:flex;justify-content:space-between;font-size:0.75rem"><span style="color:#6b7280">${k}</span><span style="font-weight:600;color:#1a2260">${v}</span></div>`;
            }).join('')}
          </div>
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
          <div style="background:#f9fafb;border-radius:0.75rem;padding:0.75rem 1rem;display:flex;align-items:center;gap:0.75rem">
            <div style="width:88px;height:54px;border-radius:0.75rem;background:linear-gradient(135deg,#f59e0b,#f97316);padding:0.5rem 0.75rem;display:flex;flex-direction:column;justify-content:space-between;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.15)">
              <span style="font-size:9px;font-weight:700;font-style:italic;color:rgba(255,255,255,0.8);letter-spacing:0.05em">VISA</span>
              <span style="font-size:9px;color:#fff;font-family:monospace;letter-spacing:0.1em">${escapeHtml(storeInfo?.CARD_NO ?? '****-****-****-****')}</span>
            </div>
            <div style="flex:1;min-width:0">
              <p style="font-size:0.75rem;font-weight:700;color:#1a2260">${escapeHtml(storeInfo?.CARD_NO ?? '카드 없음')}</p>
              <p style="font-size:11px;color:#9ca3af;margin-top:2px">${escapeHtml(storeInfo?.CYBANK_TYPE_NAME ?? '')}</p>
            </div>
            <span style="font-size:10px;font-weight:700;color:#2B3990;background:#eef0f9;border:1px solid #a9b1e1;padding:2px 8px;border-radius:9999px;flex-shrink:0">기본</span>
          </div>
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
        <button id="pm-confirm" class="btn-primary" style="flex:1;border-radius:0.75rem;padding:0.625rem 0;font-size:0.875rem">결제하기</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const close = () => { modal.remove(); onClose?.(); };
  document.getElementById('pm-close').addEventListener('click', close);
  document.getElementById('pm-cancel').addEventListener('click', close);
  document.getElementById('pm-confirm').addEventListener('click', () => {
    const installment = document.getElementById('pm-installment').value;
    modal.remove();
    onConfirm?.(installment);
  });
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
