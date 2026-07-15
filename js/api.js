const api = {
  login(id, pw) {
    if (!id || !pw) return Promise.reject(new Error('아이디와 비밀번호를 입력해주세요.'));
    localStorage.setItem(MOCK_LOGGED_IN_KEY, 'true');
    return Promise.resolve({ success: true });
  },

  logout() {
    localStorage.removeItem(MOCK_LOGGED_IN_KEY);
    localStorage.removeItem(MOCK_BASKET_KEY);
    return Promise.resolve();
  },

  getStoreInfo() {
    return Promise.resolve({ ...MOCK_STORE_INFO });
  },

  getVendors() {
    return Promise.resolve(JSON.parse(JSON.stringify(MOCK_VENDORS)));
  },

  getProducts({ vendorCd = 'ALL', keyword = '' } = {}) {
    let list = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
    if (vendorCd !== 'ALL') list = list.filter(p => p.VENDOR_CD === vendorCd);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(p => p.GOODS_NM.toLowerCase().includes(kw));
    }
    return Promise.resolve(list);
  },

  getBasketList() {
    return Promise.resolve(getBasket());
  },

  addToBasket(goodsCd, qty) {
    const product = MOCK_PRODUCTS.find(p => p.GOODS_CD === goodsCd);
    if (!product) return Promise.reject(new Error('상품을 찾을 수 없습니다.'));
    const basket = getBasket();
    const existing = basket.find(it => it.GOODS_CD === goodsCd);
    if (existing) {
      existing.ORDER_QTY += qty;
      existing.TOTAL_PRICE = existing.UNIT_PRICE * existing.ORDER_QTY;
    } else {
      basket.push({
        BASKET_SEQ: 'B' + Date.now(),
        GOODS_CD: product.GOODS_CD,
        GOODS_NM: product.GOODS_NM,
        ORDER_QTY: qty,
        UNIT_PRICE: product.UNIT_PRICE,
        UNIT_NM: product.UNIT_NM,
        TOTAL_PRICE: product.UNIT_PRICE * qty,
        CATE_NM: product.CATE_NM,
        VENDOR_CD: product.VENDOR_CD,
        VENDOR_NM: product.VENDOR_NM,
      });
    }
    saveBasket(basket);
    return Promise.resolve({ success: true });
  },

  deleteBasketItem(basketSeq) {
    saveBasket(getBasket().filter(it => it.BASKET_SEQ !== basketSeq));
    return Promise.resolve();
  },

  updateBasketQty(basketSeq, qty) {
    const basket = getBasket();
    const item = basket.find(it => it.BASKET_SEQ === basketSeq);
    if (item) { item.ORDER_QTY = qty; item.TOTAL_PRICE = item.UNIT_PRICE * qty; saveBasket(basket); }
    return Promise.resolve();
  },

  submitOrder(vendorCd) {
    const vendor = MOCK_VENDORS.find(v => v.VENDOR_CD === vendorCd);
    const vendorItems = getBasket().filter(it => it.VENDOR_CD === vendorCd);
    const totalPrice = vendorItems.reduce((s, it) => s + it.TOTAL_PRICE, 0);
    const no = 'ORD' + new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const orderDt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const remitAmount = Math.round(totalPrice * (1 + PLATFORM_FEE_RATE));
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const remitDt = new Date(now);
    remitDt.setDate(remitDt.getDate() + Math.floor(Math.random() * 3));

    const newOrders = getNewOrders();
    newOrders.unshift({
      order: {
        ORDER_NO: no,
        ORDER_DT: orderDt,
        ORDER_STAT_NM: '주문접수',
        ORDER_STAT_CD: 'RECEIVED',
        TOTAL_PRICE: totalPrice,
        GOODS_COUNT: vendorItems.length,
        STORE_NM: vendor?.VENDOR_NM ?? '-',
        CONTRACT_TYPE: pick(['결제대행', '구매대행']),
        PAY_CARD: pick(['삼성카드', '국민카드', '신한카드']),
        REMIT_TYPE: pick(['계좌이체', '카드결제']),
        REMIT_DT: `${remitDt.getFullYear()}-${pad(remitDt.getMonth() + 1)}-${pad(remitDt.getDate())}`,
        REMIT_AMOUNT: remitAmount,
        REMIT_BANK: pick(['국민은행', '신한은행', '하나은행']),
        STATEMENT_YN: 'N',
        CARD_TRADE_NO: `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${String(Math.floor(10000000 + Math.random() * 90000000))}`,
      },
      items: vendorItems.map((it, i) => ({
        SEQ: `${no}-${i}`,
        ORDER_NO: no,
        GOODS_CD: it.GOODS_CD,
        GOODS_NM: it.GOODS_NM,
        WEIGHT_KG: 0,
        UNIT_PRICE: it.UNIT_PRICE,
        TAX_TYPE: '과세',
        ORDER_QTY: it.ORDER_QTY,
        TOTAL_PRICE: it.TOTAL_PRICE,
      })),
    });
    saveNewOrders(newOrders);

    saveBasket(getBasket().filter(it => it.VENDOR_CD !== vendorCd));
    return Promise.resolve({ ORDER_NO: no });
  },

  getIngOrders(start, end) {
    const extra = getNewOrders().map(n => n.order).filter(o => o.ORDER_STAT_CD === 'RECEIVED' || o.ORDER_STAT_CD === 'DELIVERING');
    let list = [...extra, ...JSON.parse(JSON.stringify(MOCK_ING_ORDERS))];
    if (start) list = list.filter(o => o.ORDER_DT.slice(0, 10) >= start);
    if (end) list = list.filter(o => o.ORDER_DT.slice(0, 10) <= end);
    return Promise.resolve(list);
  },

  getEndOrders(start, end) {
    const extra = getNewOrders().map(n => n.order).filter(o => o.ORDER_STAT_CD === 'COMPLETED' || o.ORDER_STAT_CD === 'CANCELLED');
    let list = [...extra, ...JSON.parse(JSON.stringify(MOCK_END_ORDERS))];
    if (start) list = list.filter(o => o.ORDER_DT.slice(0, 10) >= start);
    if (end) list = list.filter(o => o.ORDER_DT.slice(0, 10) <= end);
    return Promise.resolve(list);
  },

  getOrderDetail(orderNo) {
    const extra = getNewOrders().find(n => n.order.ORDER_NO === orderNo)?.items ?? [];
    return Promise.resolve([...extra, ...MOCK_DELIVERY_ITEMS.filter(it => it.ORDER_NO === orderNo)]);
  },
};
