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
    saveBasket(getBasket().filter(it => it.VENDOR_CD !== vendorCd));
    const no = 'ORD' + new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    return Promise.resolve({ ORDER_NO: no });
  },

  getIngOrders() {
    return Promise.resolve(JSON.parse(JSON.stringify(MOCK_ING_ORDERS)));
  },

  getEndOrders() {
    return Promise.resolve(JSON.parse(JSON.stringify(MOCK_END_ORDERS)));
  },

  getOrderDetail(orderNo) {
    return Promise.resolve(MOCK_DELIVERY_ITEMS.filter(it => it.ORDER_NO === orderNo));
  },
};
