const MOCK_VENDORS = [
  { VENDOR_CD: 'V001', VENDOR_NM: '글로벌트레이드',  BIZ_NUM: '345-67-89012', REP_NAME: '박철수', CONTACT: '031-345-6789', SHIPPING_FEE: 0, FREE_SHIPPING_MIN: 0 },
  { VENDOR_CD: 'V002', VENDOR_NM: '대한도매',        BIZ_NUM: '678-90-12345', REP_NAME: '김도현', CONTACT: '032-678-9012', SHIPPING_FEE: 0, FREE_SHIPPING_MIN: 0 },
  { VENDOR_CD: 'V003', VENDOR_NM: '비즈링크 직영몰', BIZ_NUM: '123-45-67890', REP_NAME: '홍철동', CONTACT: '02-123-4567',  SHIPPING_FEE: 0, FREE_SHIPPING_MIN: 0 },
];

const MOCK_CATEGORIES = [
  { CATE_CD: 'ALL',  CATE_NM: '전체',   COUNT: 15 },
  { CATE_CD: 'GIFT', CATE_NM: '상품권', COUNT: 15 },
];

const IMG = {
  p100000: 'img/products/product_100000.jpg',
  p10000:  'img/products/product_10000.jpg',
  p1000:   'img/products/product_1000.jpg',
  p100:    'img/products/product_100.jpg',
  p10:     'img/products/product_10.jpg',
};

const MOCK_PRODUCTS = [
  { GOODS_CD: 'G001', GOODS_NM: '비즈링크 상품권 100,000원', CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE: 100000, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1, TAG: '인기', VENDOR_CD: 'V001', VENDOR_NM: '글로벌트레이드',  IMG_URL: IMG.p100000 },
  { GOODS_CD: 'G002', GOODS_NM: '비즈링크 상품권 10,000원',  CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:  10000, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V001', VENDOR_NM: '글로벌트레이드',  IMG_URL: IMG.p10000  },
  { GOODS_CD: 'G003', GOODS_NM: '비즈링크 상품권 1,000원',   CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:   1000, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V001', VENDOR_NM: '글로벌트레이드',  IMG_URL: IMG.p1000   },
  { GOODS_CD: 'G004', GOODS_NM: '비즈링크 상품권 100원',     CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:    100, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V001', VENDOR_NM: '글로벌트레이드',  IMG_URL: IMG.p100    },
  { GOODS_CD: 'G005', GOODS_NM: '비즈링크 상품권 10원',      CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:     10, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V001', VENDOR_NM: '글로벌트레이드',  IMG_URL: IMG.p10     },

  { GOODS_CD: 'G011', GOODS_NM: '비즈링크 상품권 100,000원', CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE: 100000, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1, TAG: '인기', VENDOR_CD: 'V002', VENDOR_NM: '대한도매',        IMG_URL: IMG.p100000 },
  { GOODS_CD: 'G012', GOODS_NM: '비즈링크 상품권 10,000원',  CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:  10000, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V002', VENDOR_NM: '대한도매',        IMG_URL: IMG.p10000  },
  { GOODS_CD: 'G013', GOODS_NM: '비즈링크 상품권 1,000원',   CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:   1000, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V002', VENDOR_NM: '대한도매',        IMG_URL: IMG.p1000   },
  { GOODS_CD: 'G014', GOODS_NM: '비즈링크 상품권 100원',     CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:    100, UNIT_NM: '장', STOCK_YN: 'N', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V002', VENDOR_NM: '대한도매',        IMG_URL: IMG.p100    },
  { GOODS_CD: 'G015', GOODS_NM: '비즈링크 상품권 10원',      CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:     10, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V002', VENDOR_NM: '대한도매',        IMG_URL: IMG.p10     },

  { GOODS_CD: 'G021', GOODS_NM: '비즈링크 상품권 100,000원', CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE: 100000, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1, TAG: '인기', VENDOR_CD: 'V003', VENDOR_NM: '비즈링크 직영몰', IMG_URL: IMG.p100000 },
  { GOODS_CD: 'G022', GOODS_NM: '비즈링크 상품권 10,000원',  CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:  10000, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V003', VENDOR_NM: '비즈링크 직영몰', IMG_URL: IMG.p10000  },
  { GOODS_CD: 'G023', GOODS_NM: '비즈링크 상품권 1,000원',   CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:   1000, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V003', VENDOR_NM: '비즈링크 직영몰', IMG_URL: IMG.p1000   },
  { GOODS_CD: 'G024', GOODS_NM: '비즈링크 상품권 100원',     CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:    100, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V003', VENDOR_NM: '비즈링크 직영몰', IMG_URL: IMG.p100    },
  { GOODS_CD: 'G025', GOODS_NM: '비즈링크 상품권 10원',      CATE_CD: 'GIFT', CATE_NM: '상품권', UNIT_PRICE:     10, UNIT_NM: '장', STOCK_YN: 'Y', ORIGIN: '국내', ORDER_UNIT: 1,            VENDOR_CD: 'V003', VENDOR_NM: '비즈링크 직영몰', IMG_URL: IMG.p10     },
];

const MOCK_STORE_INFO = {
  BIZ_NAME: '(주) 테스트 식당',
  ST_ADDR: '서울특별시 강남구 테헤란로 123',
  BIZ_NUM: '123-45-67890',
  BIZ_OWNER: '홍길동',
  BIZ_TEL: '02-1234-5678',
  UABLE_PAY: 150000,
  NOW_PAY: 35000,
  CARD_NO: '****-****-****-1234',
  CYBANK_TYPE_NAME: '하나은행',
  CYBANK_ACCOUNT: '123-456789-01234',
  RESIST_CARD: true,
  CASH_OSTD: 0,
  CASH_DEPOSIT: 0,
};

const MOCK_BASKET_ITEMS = [
  { BASKET_SEQ: 'B001', GOODS_CD: 'G001', GOODS_NM: '비즈링크 상품권 100,000원', ORDER_QTY: 10, UNIT_PRICE: 100000, UNIT_NM: '장', TOTAL_PRICE: 1000000, CATE_NM: '상품권', VENDOR_CD: 'V001', VENDOR_NM: '글로벌트레이드'  },
  { BASKET_SEQ: 'B002', GOODS_CD: 'G011', GOODS_NM: '비즈링크 상품권 100,000원', ORDER_QTY:  5, UNIT_PRICE: 100000, UNIT_NM: '장', TOTAL_PRICE:  500000, CATE_NM: '상품권', VENDOR_CD: 'V002', VENDOR_NM: '대한도매'        },
  { BASKET_SEQ: 'B003', GOODS_CD: 'G002', GOODS_NM: '비즈링크 상품권 10,000원',  ORDER_QTY: 20, UNIT_PRICE:  10000, UNIT_NM: '장', TOTAL_PRICE:  200000, CATE_NM: '상품권', VENDOR_CD: 'V001', VENDOR_NM: '글로벌트레이드'  },
];

const MOCK_ING_ORDERS = [
  { ORDER_NO: 'ORD20260609001', ORDER_DT: '2026-06-09 09:30', ORDER_STAT_NM: '배송중',   ORDER_STAT_CD: 'DELIVERING', TOTAL_PRICE: 1200000, GOODS_COUNT: 2, STORE_NM: '글로벌트레이드'  },
  { ORDER_NO: 'ORD20260608001', ORDER_DT: '2026-06-08 14:20', ORDER_STAT_NM: '주문접수', ORDER_STAT_CD: 'RECEIVED',   TOTAL_PRICE:  600000, GOODS_COUNT: 2, STORE_NM: '대한도매'        },
];

const MOCK_END_ORDERS = [
  { ORDER_NO: 'ORD20260607001', ORDER_DT: '2026-06-07 10:15', ORDER_STAT_NM: '배송완료', ORDER_STAT_CD: 'COMPLETED', TOTAL_PRICE:  350000, GOODS_COUNT: 2, DELIVERY_DT: '2026-06-08', STORE_NM: '비즈링크 직영몰' },
  { ORDER_NO: 'ORD20260605001', ORDER_DT: '2026-06-05 08:45', ORDER_STAT_NM: '배송완료', ORDER_STAT_CD: 'COMPLETED', TOTAL_PRICE: 2050000, GOODS_COUNT: 2, DELIVERY_DT: '2026-06-06', STORE_NM: '글로벌트레이드'  },
  { ORDER_NO: 'ORD20260601001', ORDER_DT: '2026-06-01 11:00', ORDER_STAT_NM: '배송완료', ORDER_STAT_CD: 'COMPLETED', TOTAL_PRICE: 1530000, GOODS_COUNT: 2, DELIVERY_DT: '2026-06-02', STORE_NM: '대한도매'        },
];

const MOCK_DELIVERY_ITEMS = [
  { SEQ: 'DI001', ORDER_NO: 'ORD20260609001', GOODS_CD: 'G001', GOODS_NM: '비즈링크 상품권 100,000원', WEIGHT_KG: 0, UNIT_PRICE: 100000, TAX_TYPE: '과세', ORDER_QTY: 10, TOTAL_PRICE: 1000000 },
  { SEQ: 'DI002', ORDER_NO: 'ORD20260609001', GOODS_CD: 'G002', GOODS_NM: '비즈링크 상품권 10,000원',  WEIGHT_KG: 0, UNIT_PRICE:  10000, TAX_TYPE: '과세', ORDER_QTY: 20, TOTAL_PRICE:  200000 },
  { SEQ: 'DI003', ORDER_NO: 'ORD20260608001', GOODS_CD: 'G011', GOODS_NM: '비즈링크 상품권 100,000원', WEIGHT_KG: 0, UNIT_PRICE: 100000, TAX_TYPE: '과세', ORDER_QTY:  5, TOTAL_PRICE:  500000 },
  { SEQ: 'DI004', ORDER_NO: 'ORD20260608001', GOODS_CD: 'G012', GOODS_NM: '비즈링크 상품권 10,000원',  WEIGHT_KG: 0, UNIT_PRICE:  10000, TAX_TYPE: '과세', ORDER_QTY: 10, TOTAL_PRICE:  100000 },
  { SEQ: 'DI005', ORDER_NO: 'ORD20260607001', GOODS_CD: 'G021', GOODS_NM: '비즈링크 상품권 100,000원', WEIGHT_KG: 0, UNIT_PRICE: 100000, TAX_TYPE: '과세', ORDER_QTY:  3, TOTAL_PRICE:  300000 },
  { SEQ: 'DI006', ORDER_NO: 'ORD20260607001', GOODS_CD: 'G022', GOODS_NM: '비즈링크 상품권 10,000원',  WEIGHT_KG: 0, UNIT_PRICE:  10000, TAX_TYPE: '과세', ORDER_QTY:  5, TOTAL_PRICE:   50000 },
  { SEQ: 'DI007', ORDER_NO: 'ORD20260605001', GOODS_CD: 'G001', GOODS_NM: '비즈링크 상품권 100,000원', WEIGHT_KG: 0, UNIT_PRICE: 100000, TAX_TYPE: '과세', ORDER_QTY: 20, TOTAL_PRICE: 2000000 },
  { SEQ: 'DI008', ORDER_NO: 'ORD20260605001', GOODS_CD: 'G003', GOODS_NM: '비즈링크 상품권 1,000원',   WEIGHT_KG: 0, UNIT_PRICE:   1000, TAX_TYPE: '과세', ORDER_QTY: 50, TOTAL_PRICE:   50000 },
  { SEQ: 'DI009', ORDER_NO: 'ORD20260601001', GOODS_CD: 'G011', GOODS_NM: '비즈링크 상품권 100,000원', WEIGHT_KG: 0, UNIT_PRICE: 100000, TAX_TYPE: '과세', ORDER_QTY: 15, TOTAL_PRICE: 1500000 },
  { SEQ: 'DI010', ORDER_NO: 'ORD20260601001', GOODS_CD: 'G013', GOODS_NM: '비즈링크 상품권 1,000원',   WEIGHT_KG: 0, UNIT_PRICE:   1000, TAX_TYPE: '과세', ORDER_QTY: 30, TOTAL_PRICE:   30000 },
];

const MOCK_PAY_HISTORY = [
  { date: '2025-06-10', desc: '페이 충전', amount:  200000, balance: 369302 },
  { date: '2025-06-09', desc: '상품 구매', amount: -150000, balance: 169302 },
  { date: '2025-06-07', desc: '페이 충전', amount:  100000, balance: 319302 },
  { date: '2025-06-05', desc: '상품 구매', amount:  -50000, balance: 219302 },
  { date: '2025-06-01', desc: '페이 충전', amount:  150000, balance: 269302 },
  { date: '2025-05-28', desc: '상품 구매', amount:  -90000, balance: 119302 },
  { date: '2025-05-20', desc: '페이 충전', amount:  100000, balance: 209302 },
];

const MOCK_VENDOR_APPROVALS = [
  { id: 1, name: '프레시마트',   biz_num: '111-22-33333', rep: '이순신', applied: '2026-06-01', status: '승인완료', status_cd: 'APPROVED'  },
  { id: 2, name: '대성유통',     biz_num: '222-33-44444', rep: '강감찬', applied: '2026-06-03', status: '검토중',   status_cd: 'REVIEWING' },
  { id: 3, name: '하나식품',     biz_num: '333-44-55555', rep: '장보고', applied: '2026-06-05', status: '반려',     status_cd: 'REJECTED'  },
  { id: 4, name: '서울식자재',   biz_num: '444-55-66666', rep: '세종대왕', applied: '2026-06-08', status: '승인완료', status_cd: 'APPROVED'  },
  { id: 5, name: '글로벌푸드',   biz_num: '555-66-77777', rep: '유관순', applied: '2026-06-10', status: '검토중',   status_cd: 'REVIEWING' },
];
