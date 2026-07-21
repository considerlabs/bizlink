const BM_CATEGORIES = [
  { key: 'delivery', label: '배달서비스' },
  { key: 'moving',   label: '화물이사서비스' },
  { key: 'cleaning', label: '청소서비스' },
  { key: 'lesson',   label: '레슨' },
];

const BM_SERVICES = [
  // 배달서비스
  { id: 'DEL-PREMIUM',  category: 'delivery', name: '배달서비스 프리미엄', price: 300000, rating: 4.9, reviews: 85,  best: true,  icon: '🚢', bg: 'linear-gradient(135deg,#0c4a6e,#0369a1)' },
  { id: 'DEL-STANDARD', category: 'delivery', name: '배달서비스 스탠다드', price: 200000, rating: 4.7, reviews: 132, best: false, icon: '🚛', bg: 'linear-gradient(135deg,#075985,#0284c7)' },
  { id: 'DEL-BASIC',    category: 'delivery', name: '배달서비스 베이직',   price: 100000, rating: 4.5, reviews: 210, best: false, icon: '🚚', bg: 'linear-gradient(135deg,#0369a1,#0ea5e9)' },
  { id: 'DEL-MINI',     category: 'delivery', name: '배달서비스 미니',     price: 10000,  rating: 4.3, reviews: 378, best: false, icon: '📦', bg: 'linear-gradient(135deg,#0284c7,#38bdf8)' },

  // 화물이사서비스
  { id: 'MOV-PREMIUM',  category: 'moving', name: '화물이사서비스 프리미엄', price: 300000, rating: 4.9, reviews: 67,  best: true,  icon: '🚛', bg: 'linear-gradient(135deg,#78350f,#b45309)' },
  { id: 'MOV-STANDARD', category: 'moving', name: '화물이사서비스 스탠다드', price: 200000, rating: 4.7, reviews: 94,  best: false, icon: '📦', bg: 'linear-gradient(135deg,#92400e,#d97706)' },
  { id: 'MOV-BASIC',    category: 'moving', name: '화물이사서비스 베이직',   price: 100000, rating: 4.5, reviews: 156, best: false, icon: '🏠', bg: 'linear-gradient(135deg,#b45309,#f59e0b)' },
  { id: 'MOV-MINI',     category: 'moving', name: '화물이사서비스 미니',     price: 10000,  rating: 4.2, reviews: 203, best: false, icon: '🧳', bg: 'linear-gradient(135deg,#d97706,#fbbf24)' },

  // 청소서비스
  { id: 'CLN-PREMIUM',  category: 'cleaning', name: '청소서비스 프리미엄', price: 300000, rating: 4.9, reviews: 143, best: true,  icon: '🪟', bg: 'linear-gradient(135deg,#134e4a,#0f766e)' },
  { id: 'CLN-STANDARD', category: 'cleaning', name: '청소서비스 스탠다드', price: 200000, rating: 4.8, reviews: 187, best: false, icon: '🧴', bg: 'linear-gradient(135deg,#115e59,#14b8a6)' },
  { id: 'CLN-BASIC',    category: 'cleaning', name: '청소서비스 베이직',   price: 100000, rating: 4.6, reviews: 265, best: false, icon: '🛏️', bg: 'linear-gradient(135deg,#0f766e,#2dd4bf)' },
  { id: 'CLN-MINI',     category: 'cleaning', name: '청소서비스 미니',     price: 10000,  rating: 4.4, reviews: 412, best: false, icon: '🛋️', bg: 'linear-gradient(135deg,#0d9488,#5eead4)' },

  // 레슨
  { id: 'LES-PREMIUM',  category: 'lesson', name: '레슨서비스 프리미엄', price: 300000, rating: 4.9, reviews: 52,  best: true,  icon: '👨‍🏫', bg: 'linear-gradient(135deg,#4c1d95,#6d28d9)' },
  { id: 'LES-STANDARD', category: 'lesson', name: '레슨서비스 스탠다드', price: 200000, rating: 4.7, reviews: 78,  best: false, icon: '📚', bg: 'linear-gradient(135deg,#5b21b6,#7c3aed)' },
  { id: 'LES-BASIC',    category: 'lesson', name: '레슨서비스 베이직',   price: 100000, rating: 4.6, reviews: 115, best: false, icon: '✍️', bg: 'linear-gradient(135deg,#6d28d9,#8b5cf6)' },
  { id: 'LES-MINI',     category: 'lesson', name: '레슨서비스 미니',     price: 10000,  rating: 4.5, reviews: 189, best: false, icon: '📖', bg: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
];

const BM_MEMBER = {
  NAME: '',
  LOGIN_ID: 'm23456789',
  MEMBER_NO: 'MBR000013',
  PHONE: '010-2345-6789',
  LIMIT_ONCE: 1000000,
  LIMIT_MONTH: 3000000,
};

const BM_EXPERTS = ['홍길자', '김민준', '이서연', '박도윤', '최지우'];

const BM_CARD_COMPANIES = ['현대카드', '비씨카드', 'KB국민카드', '삼성카드', '신한카드', '롯데카드', 'NH농협카드', '하나카드', '씨티카드', '케이뱅크카드', '하나카드(외환)'];
const BM_SIMPLE_PAYS = ['카카오페이', 'L.pay', 'PAYCO', 'KPAY', 'INIpay-간편결제'];
const BM_INSTALLMENTS = ['일시불', '2개월', '3개월', '6개월', '12개월'];

function bmSvc(id) {
  return BM_SERVICES.find(s => s.id === id);
}

// Seed order history (newest first). Totals are derived at runtime from
// subtotal * (1 + PLATFORM_FEE_RATE), never hardcoded here.
const BM_HISTORY_SEED = [
  { date: '2026-07-21', items: [{ id: 'DEL-PREMIUM', qty: 1 }] },
  { date: '2026-07-21', items: [{ id: 'DEL-STANDARD', qty: 1 }, { id: 'CLN-PREMIUM', qty: 1 }] },
  { date: '2026-07-21', items: [{ id: 'LES-STANDARD', qty: 1 }] },
  { date: '2026-07-20', items: [{ id: 'MOV-BASIC', qty: 1 }] },
  { date: '2026-07-20', items: [{ id: 'CLN-STANDARD', qty: 2 }] },
  { date: '2026-07-19', items: [{ id: 'DEL-MINI', qty: 3 }] },
  { date: '2026-07-19', items: [{ id: 'LES-BASIC', qty: 1 }] },
  { date: '2026-07-18', items: [{ id: 'MOV-PREMIUM', qty: 1 }] },
  { date: '2026-07-18', items: [{ id: 'CLN-MINI', qty: 2 }] },
  { date: '2026-07-17', items: [{ id: 'DEL-BASIC', qty: 1 }] },
  { date: '2026-07-16', items: [{ id: 'LES-MINI', qty: 4 }] },
  { date: '2026-07-15', items: [{ id: 'MOV-STANDARD', qty: 1 }] },
  { date: '2026-07-14', items: [{ id: 'CLN-BASIC', qty: 1 }] },
  { date: '2026-07-12', items: [{ id: 'DEL-STANDARD', qty: 1 }] },
];
