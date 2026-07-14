/* ============================================================
   LK MODAS — script.js
   Produtos vêm 100% do Firebase (Firestore).
   Carrinho e sessão do cliente ficam no localStorage.
   ============================================================ */
'use strict';

console.log('🚀 LK Modas - Sincronização de Produtos Ativada');

/* ── Chaves localStorage ─────────────────────────────────────── */
const CART_KEY    = 'lkmodas_cart';
const SESSION_KEY = 'lkmodas_session';
const ORDERS_KEY  = 'lkmodas_orders';

/* ── Regras de negócio compartilhadas ────────────────────────── */
const FRETE_GRATIS_MIN = 300;   // frete grátis acima deste subtotal
const WHATSAPP_NUM     = '5516993603482';

/* ── Helpers de storage ──────────────────────────────────────── */
function storageGet(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function storageDel(key) {
  try { localStorage.removeItem(key); } catch {}
}

/* ── Cache de produtos (preenchido pelo Firebase) ────────────── */
window.__LK_PRODUCTS_CACHE = window.__LK_PRODUCTS_CACHE || [];

const sameId = (a, b) => String(a) === String(b);
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=533&fit=crop&q=80';

function normalizeProduct(p) {
  return {
    ...p,
    id:          String(p.id || ''),
    name:        String(p.name || ''),
    category:    String(p.category || 'masculino').toLowerCase(),
    price:       Number(p.price)  || 0,
    oldPrice:    p.oldPrice ? Number(p.oldPrice) : null,
    stock:       Math.max(0, parseInt(p.stock ?? p.estoque ?? 0, 10)),
    img:         p.img  || p.image  || FALLBACK_IMG,
    img2:        p.img2 || null,
    img3:        p.img3 || null,
    badge:       p.badge    || null,
    featured:    !!p.featured,
    sizes:       Array.isArray(p.sizes) ? p.sizes : [],
    description: p.description || '',
  };
}

/* ── Products API ────────────────────────────────────────────── */
const Products = {
  getAll() {
    return (window.__LK_PRODUCTS_CACHE || []).map(normalizeProduct);
  },
  setCache(list) {
    window.__LK_PRODUCTS_CACHE = Array.isArray(list) ? list : [];
    window.dispatchEvent(new CustomEvent('products-updated'));
    console.log(`📦 Cache atualizado com ${list.length} produtos`);
  },
  /* Escuta em tempo real e mantém sincronização contínua */
  _unsubscribe: null,
  async startSync() {
    if (!window.FB) {
      console.warn('❌ Firebase não está pronto');
      return;
    }
    try {
      /* 1) busca imediata */
      console.log('🔄 Buscando produtos do Firebase...');
      const list = await window.FB.getProducts();
      if (list && list.length) {
        this.setCache(list);
        console.log(`✅ ${list.length} produtos carregados do Firebase`);
      } else {
        console.log('⚠️ Nenhum produto encontrado no Firebase');
      }
      /* 2) escuta em tempo real — qualquer alteração no admin chega aqui */
      if (this._unsubscribe) {
        console.log('🛑 Parando listener anterior...');
        this._unsubscribe();
      }
      this._unsubscribe = window.FB.listenProducts(list => {
        console.log(`🔔 Listener: ${list.length} produtos recebidos`);
        this.setCache(list);
      });
      console.log('📡 Listener de tempo real iniciado');
    } catch (err) {
      console.error('❌ Erro ao sincronizar produtos:', err);
    }
  },
  stopSync() {
    if (this._unsubscribe) {
      console.log('🛑 Parando sincronização...');
      this._unsubscribe();
      this._unsubscribe = null;
    }
  },
};

/* ── Cart API ────────────────────────────────────────────────── */
const Cart = {
  get()      { return storageGet(CART_KEY, []); },
  save(c)    { storageSet(CART_KEY, c); },
  count()    { return this.get().reduce((s, i) => s + (i.qty || 0), 0); },
  total() {
    const all = Products.getAll();
    return this.get().reduce((s, i) => {
      const p = all.find(x => sameId(x.id, i.id));
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  },
  add(productId) {
    const id   = String(productId);
    const prod = Products.getAll().find(p => sameId(p.id, id));
    if (!prod)            { showToast('Produto não encontrado.'); return; }
    if (prod.stock === 0) { showToast(`"${prod.name}" está indisponível.`); return; }
    const cart = this.get();
    const item = cart.find(i => sameId(i.id, id));
    if (item && item.qty >= prod.stock) {
      showToast(`Apenas ${prod.stock} unidade(s) disponíveis.`); return;
    }
    if (item) item.qty++; else cart.push({ id, qty: 1 });
    this.save(cart); updateCartCount();
    showToast(`"${prod.name}" adicionado ao carrinho! 🛒`);
  },
  remove(productId) {
    this.save(this.get().filter(i => !sameId(i.id, productId)));
    updateCartCount();
  },
  setQty(productId, qty) {
    const id   = String(productId);
    const cart = this.get();
    const item = cart.find(i => sameId(i.id, id));
    const prod = Products.getAll().find(p => sameId(p.id, id));
    if (!item || !prod) return;
    item.qty = Math.max(1, Math.min(qty, prod.stock));
    this.save(cart);
    if (qty > prod.stock) showToast(`Apenas ${prod.stock} unidade(s) disponíveis.`);
    updateCartCount();
  },
  clear() { this.save([]); updateCartCount(); },
};

/* ── Auth API ────────────────────────────────────────────────── */
const Auth = {
  getSession() {
    if (window.FB?.getCurrentUser?.()) {
      const u = window.FB.getCurrentUser();
      return { name: u.displayName || u.email.split('@')[0], email: u.email, uid: u.uid };
    }
    return storageGet(SESSION_KEY, null);
  },
  async register(name, email, password) {
    if (!window.FB) return { ok: false, msg: 'Firebase indisponível.' };
    const r = await window.FB.register(name, email, password);
    if (r.ok) storageSet(SESSION_KEY, { name, email, uid: r.user.uid });
    return r;
  },
  async login(email, password) {
    if (!window.FB) return { ok: false, msg: 'Firebase indisponível.' };
    const r = await window.FB.login(email, password);
    if (r.ok) storageSet(SESSION_KEY, {
      name:  r.user.displayName || email.split('@')[0],
      email: r.user.email,
      uid:   r.user.uid,
    });
    return r;
  },
  logout() {
    storageDel(SESSION_KEY);
    storageDel(CART_KEY);
    if (window.FB) window.FB.logout();
    else window.location.href = 'index.html';
  },
  isLoggedIn() { return !!this.getSession(); },
};

/* ── Orders API ──────────────────────────────────────────────── */
const Orders = {
  async add(data) {
    const order = { id: data.id || `PED-${Date.now()}`, createdAt: new Date().toISOString(), ...data };
    if (window.FB) await window.FB.saveOrder(order).catch(console.error);
    const list = storageGet(ORDERS_KEY, []);
    const idx  = list.findIndex(o => o.id === order.id);
    if (idx >= 0) list[idx] = order; else list.push(order);
    storageSet(ORDERS_KEY, list);
    return order;
  },
};

/* ── Payment ─────────────────────────────────────────────────── */
const Payment = {
  processPix: (amount) =>
    Promise.resolve({ ok: true, method: 'pix', pixKey: '+5516993603482', amount }),
  processCard(cardData, amount) {
    const num = (cardData.number || '').replace(/\s/g, '');
    let sum = 0, even = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = parseInt(num[i]);
      if (even) { d *= 2; if (d > 9) d -= 9; }
      sum += d; even = !even;
    }
    if (!/^\d{13,19}$/.test(num) || sum % 10 !== 0)
      return Promise.resolve({ ok: false, message: 'Cartão inválido.' });
    return Promise.resolve({
      ok: true, method: 'cartao', amount,
      lastDigits: num.slice(-4),
      installments: cardData.installments || '1x sem juros',
    });
  },
};

/* ── Helpers UI ──────────────────────────────────────────────── */
function updateCartCount() {
  const n = Cart.count();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = n;
    el.style.display = n > 0 ? 'flex' : 'none';
  });
}

function showToast(msg, type = 'info') {
  let el = document.querySelector('.toast');
  if (!el) { 
    el = document.createElement('div'); 
    el.className = 'toast'; 
    document.body.appendChild(el); 
  }
  
  const icons = {
    'success': '✅',
    'info': 'ℹ️',
    'warning': '⚠️',
    'error': '❌'
  };
  const icon = icons[type] || icons.info;
  
  const colors = {
    'success': '#22c55e',
    'info': '#3b82f6',
    'warning': '#eab308',
    'error': '#ef4444'
  };
  const color = colors[type] || colors.info;
  
  el.innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:white"><span>${icon}</span><span>${msg}</span></div>`;
  el.style.background = color;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3200);
}

function formatPrice(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function badgeHTML(badge) {
  const m = { new: ['badge-new','NOVO'], sale: ['badge-sale','SALE'], hot: ['badge-hot','HOT'] };
  const b = m[badge]; return b ? `<span class="badge ${b[0]}">${b[1]}</span>` : '';
}

function stockHTML(p) {
  if (p.stock === 0)  return `<div class="product-stock unavailable">Indisponível</div>`;
  if (p.stock === 1)  return `<div class="product-stock stock-low">🔥 Última unidade!</div>`;
  if (p.stock <= 3)   return `<div class="product-stock stock-low">🔥 Últimas ${p.stock} unidades!</div>`;
  return `<div class="product-stock stock-ok">✓ Pronta entrega</div>`;
}

function productCardHTML(p) {
  const disc    = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const unavail = p.stock === 0;
  return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-img-wrap">
        <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
        <div class="product-badges">
          ${disc > 0 ? `<span class="badge badge-discount">-${disc}%</span>` : ''}
          ${badgeHTML(p.badge)}
        </div>
        <button class="product-quick-add btn-add-cart" data-id="${p.id}" ${unavail ? 'disabled' : ''}>
          ${unavail ? 'Indisponível' : '+ Adicionar ao Carrinho'}
        </button>
      </div>
      <div class="product-info">
        <p class="product-category">${p.category}</p>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-price-row">
          <span class="price-current">${formatPrice(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${formatPrice(p.oldPrice)}</span>` : ''}
          ${disc > 0   ? `<span class="price-discount">-${disc}%</span>` : ''}
        </div>
        ${stockHTML(p)}
      </div>
    </article>`;
}

function bindCards(root) {
  const el = root || document;
  el.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); Cart.add(btn.dataset.id); });
  });
  el.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (!e.target.closest('.btn-add-cart'))
        window.location.href = `produto.html?id=${card.dataset.id}`;
    });
  });
}

const LOADING = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--gray-400)">
  <div style="font-size:2rem;margin-bottom:8px">⏳</div>Carregando produtos...</div>`;

/* ── Header ──────────────────────────────────────────────────── */
function initHeader() {
  updateCartCount();

  function setUser(name) {
    const btn = document.getElementById('minha-conta-btn');
    if (btn) {
      btn.textContent = name ? `👤 Olá, ${name.split(' ')[0]}` : '👤 Entrar';
      btn.href = name ? 'minha-conta.html' : 'login.html';
    }
    document.querySelectorAll('.user-btn').forEach(b => {
      if (b.id === 'minha-conta-btn') return;
      b.textContent = name ? `Olá, ${name.split(' ')[0]}` : 'Entrar';
      b.onclick = () => { window.location.href = name ? 'minha-conta.html' : 'login.html'; };
    });
  }

  const s = storageGet(SESSION_KEY, null);
  if (s) setUser(s.name);

  window.addEventListener('firebase-ready', () => {
    window.FB.onAuthChange(user => {
      // Ignora login do admin para não poluir a sessão do cliente
      const ADMIN_EMAIL = 'lkmodamasculina089@gmail.com';
      if (user && user.email !== ADMIN_EMAIL) {
        storageSet(SESSION_KEY, {
          name:  user.displayName || user.email.split('@')[0],
          email: user.email, uid: user.uid,
        });
        setUser(user.displayName || user.email.split('@')[0]);
      } else if (!user) {
        // Só limpa se não for página do admin
        if (!window.location.pathname.includes('admin')) {
          storageDel(SESSION_KEY);
          setUser(null);
        }
      }
    });
  }, { once: true });

  const menuBtn  = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');
  const closeBtn  = document.querySelector('.mobile-nav .close-btn');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => mobileNav.classList.add('open'));
    if (closeBtn) closeBtn.addEventListener('click', () => mobileNav.classList.remove('open'));
  }
}

/* ── Home Page ───────────────────────────────────────────────── */
function initHome() {
  const g1 = document.getElementById('grid-new');
  const g2 = document.getElementById('grid-top');
  const g3 = document.getElementById('grid-promo');
  if (!g1) return;

  function render() {
    const all = Products.getAll();
    if (!all.length) { g1.innerHTML = g2.innerHTML = g3.innerHTML = LOADING; return; }

    const sorted = all.slice().sort((a, b) => {
      const ts = x => Number(String(x.id).replace(/\D/g, '')) || 0;
      return ts(b) - ts(a);
    });

    const novos = sorted.filter(p => p.badge === 'new').slice(0, 4);
    const top   = sorted.filter(p => p.featured).slice(0, 4);
    const promo = sorted.filter(p => p.badge === 'sale').slice(0, 4);
    const base  = sorted.slice(0, 4);

    g1.innerHTML = (novos.length ? novos : base).map(productCardHTML).join('');
    g2.innerHTML = (top.length   ? top   : base).map(productCardHTML).join('');
    g3.innerHTML = (promo.length ? promo : base).map(productCardHTML).join('');
    bindCards();
  }

  render();
  window.addEventListener('products-updated', render);
}

/* ── Produtos Page ───────────────────────────────────────────── */
function initProducts() {
  const grid    = document.getElementById('products-grid');
  const countEl = document.getElementById('products-count');
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  let active = params.get('categoria') || 'todos';

  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === active);
  });

  function render() {
    const all = Products.getAll();
    if (!all.length) { grid.innerHTML = LOADING; if (countEl) countEl.textContent = ''; return; }

    const sorted = all.slice().sort((a, b) => {
      const ts = x => Number(String(x.id).replace(/\D/g, '')) || 0;
      return ts(b) - ts(a);
    });
    const list = active === 'todos' ? sorted : sorted.filter(p => p.category === active);

    grid.innerHTML = list.length
      ? list.map(productCardHTML).join('')
      : `<p style="grid-column:1/-1;text-align:center;color:var(--gray-400);padding:60px 0">Nenhum produto encontrado.</p>`;

    if (countEl) countEl.textContent = `${list.length} produto${list.length !== 1 ? 's' : ''}`;
    bindCards(grid);
  }

  document.querySelectorAll('.filter-btn').forEach(b => {
    b.addEventListener('click', () => {
      active = b.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      render();
    });
  });

  render();
  window.addEventListener('products-updated', render);
}

/* ── Carrinho Page ───────────────────────────────────────────── */
function initCart() {
  const wrap   = document.getElementById('cart-container');
  const empty  = document.getElementById('cart-empty');
  if (!wrap) return;

  function render() {
    const items = Cart.get();
    const prods = Products.getAll();
    if (!prods.length) return; // aguarda produtos carregarem antes de validar
    let dirty = false;

    const valid = items.filter(item => {
      const p = prods.find(x => sameId(x.id, item.id));
      if (!p) { dirty = true; return false; }
      if (p.stock === 0) {
        dirty = true; showToast(`"${p.name}" removido (indisponível).`); return false;
      }
      if (item.qty > p.stock) { item.qty = p.stock; dirty = true; }
      return true;
    });
    if (dirty) { Cart.save(valid); updateCartCount(); }

    if (!valid.length) {
      wrap.innerHTML = '';
      if (empty) empty.style.display = 'block';
      updateSummary(0); return;
    }
    if (empty) empty.style.display = 'none';

    wrap.innerHTML = valid.map(item => {
      const p = prods.find(x => sameId(x.id, item.id));
      if (!p) return '';
      return `
        <div class="cart-item" data-id="${item.id}">
          <img class="cart-item-img" src="${p.img}" alt="${p.name}" onerror="this.src='${FALLBACK_IMG}'">
          <div>
            <div class="cart-item-name">${p.name}</div>
            <div class="cart-item-cat">${p.category}</div>
            <div class="qty-control">
              <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn qty-plus"  data-id="${item.id}">+</button>
            </div>
          </div>
          <div>
            <div class="cart-item-price">${formatPrice(p.price * item.qty)}</div>
            <span class="cart-item-remove" data-id="${item.id}">Remover</span>
          </div>
        </div>`;
    }).join('');

    wrap.querySelectorAll('.qty-minus').forEach(btn => btn.addEventListener('click', () => {
      const it = valid.find(i => sameId(i.id, btn.dataset.id));
      if (!it) return;
      if (it.qty <= 1) Cart.remove(btn.dataset.id); else Cart.setQty(btn.dataset.id, it.qty - 1);
      render();
    }));
    wrap.querySelectorAll('.qty-plus').forEach(btn => btn.addEventListener('click', () => {
      const it = valid.find(i => sameId(i.id, btn.dataset.id));
      if (it) { Cart.setQty(btn.dataset.id, it.qty + 1); render(); }
    }));
    wrap.querySelectorAll('.cart-item-remove').forEach(btn => btn.addEventListener('click', () => {
      Cart.remove(btn.dataset.id); render();
    }));

    updateSummary(Cart.total());
    renderCrossSell(valid, prods);
  }

  function updateSummary(total) {
    const s = document.getElementById('summary-subtotal');
    const t = document.getElementById('summary-total');
    const shippingLine = document.getElementById('shipping-line');
    if (s) s.textContent = formatPrice(total);
    // Frete só aparece após o cliente informar o CEP — não calculamos aqui
    if (shippingLine && shippingLine.style.display === 'flex') {
      // Mantém o frete já calculado e recalcula o total
      const h = document.getElementById('summary-shipping');
      const isGratis = h && h.textContent === 'GRÁTIS';
      const ship = isGratis ? 0 : 19.90;
      if (t) t.textContent = formatPrice(total + ship);
    } else {
      if (t) t.textContent = formatPrice(total);
    }
    updateFreeShipBar(total);
  }

  function updateFreeShipBar(subtotal) {
    const bar = document.getElementById('free-ship-bar');
    if (!bar) return;
    if (subtotal <= 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'block';
    const falta = FRETE_GRATIS_MIN - subtotal;
    const pct   = Math.min(100, (subtotal / FRETE_GRATIS_MIN) * 100);
    if (falta > 0) {
      bar.classList.remove('done');
      bar.innerHTML = `
        <div class="fs-msg">🚚 Faltam <strong>${formatPrice(falta)}</strong> para FRETE GRÁTIS</div>
        <div class="free-ship-track"><div class="free-ship-fill" style="width:${pct}%"></div></div>`;
    } else {
      bar.classList.add('done');
      bar.innerHTML = `
        <div class="fs-msg">🎉 Você ganhou <strong>FRETE GRÁTIS!</strong></div>
        <div class="free-ship-track"><div class="free-ship-fill" style="width:100%"></div></div>`;
    }
  }

  /* Cross-sell: sugere peças que combinam (mesma categoria, em estoque, fora do carrinho) */
  function renderCrossSell(cartItems, prods) {
    const box = document.getElementById('cross-sell');
    if (!box) return;
    const inCart = new Set(cartItems.map(i => String(i.id)));
    const cats   = new Set(cartItems.map(i => {
      const p = prods.find(x => sameId(x.id, i.id));
      return p ? p.category : null;
    }).filter(Boolean));

    const suggestions = prods
      .filter(p => !inCart.has(String(p.id)) && p.stock > 0)
      .sort((a, b) => {
        const aCat = cats.has(a.category) ? 0 : 1;
        const bCat = cats.has(b.category) ? 0 : 1;
        if (aCat !== bCat) return aCat - bCat;
        const aFeat = a.featured ? 0 : 1;
        const bFeat = b.featured ? 0 : 1;
        if (aFeat !== bFeat) return aFeat - bFeat;
        return a.price - b.price;
      })
      .slice(0, 4);

    if (!suggestions.length) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    box.innerHTML = `
      <h3>Complete o look ✨</h3>
      <div class="cross-sell-grid">
        ${suggestions.map(p => `
          <div class="cross-sell-card">
            <img src="${p.img}" alt="${p.name}" loading="lazy"
              onerror="this.src='${FALLBACK_IMG}'"
              onclick="window.location.href='produto.html?id=${p.id}'">
            <div class="cross-sell-info">
              <div class="cs-name">${p.name}</div>
              <div class="cs-price">${formatPrice(p.price)}</div>
              <button class="cs-add" data-id="${p.id}">+ Adicionar</button>
            </div>
          </div>`).join('')}
      </div>`;
    box.querySelectorAll('.cs-add').forEach(btn => {
      btn.addEventListener('click', () => { Cart.add(btn.dataset.id); render(); });
    });
  }

  render();
  window.addEventListener('products-updated', render);

  // Se produtos ainda não carregaram após 3s, força busca no Firebase
  setTimeout(() => {
    if (!Products.getAll().length && window.FB) {
      window.FB.getProducts().then(list => {
        if (list && list.length) Products.setCache(list);
      }).catch(() => {});
    }
  }, 3000);
}

/* ── Login Page ──────────────────────────────────────────────── */
function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.email.value.trim();
    const pass  = form.password.value;
    const eErr  = document.getElementById('email-error');
    const pErr  = document.getElementById('pass-error');
    let ok = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      eErr.textContent = 'E-mail inválido.'; eErr.classList.add('show'); ok = false;
    } else eErr.classList.remove('show');
    if (!pass) {
      pErr.textContent = 'Informe sua senha.'; pErr.classList.add('show'); ok = false;
    } else pErr.classList.remove('show');
    if (!ok) return;
    const r = await Auth.login(email, pass);
    if (r.ok) {
      showToast('Bem-vindo(a)! 👋');
      const next = sessionStorage.getItem('redirect_after_login') || new URLSearchParams(window.location.search).get('next');
      sessionStorage.removeItem('redirect_after_login');
      setTimeout(() => { window.location.href = next ? next + '.html' : 'index.html'; }, 900);
    } else {
      pErr.textContent = r.msg || 'E-mail ou senha incorretos.'; pErr.classList.add('show');
    }
  });
}

/* ── Cadastro Page ───────────────────────────────────────────── */
function initCadastro() {
  const form = document.getElementById('cadastro-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = form.nome.value.trim();
    const email = form.email.value.trim();
    const pass  = form.senha.value;
    const conf  = form.confirma.value;
    let ok = true;
    const nE = document.getElementById('nome-error');
    const eE = document.getElementById('email-error');
    const pE = document.getElementById('senha-error');
    const cE = document.getElementById('confirma-error');
    if (name.length < 3)  { nE.textContent = 'Nome muito curto.';        nE.classList.add('show'); ok = false; } else nE.classList.remove('show');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { eE.textContent = 'E-mail inválido.'; eE.classList.add('show'); ok = false; } else eE.classList.remove('show');
    if (pass.length < 6)  { pE.textContent = 'Mínimo 6 caracteres.';     pE.classList.add('show'); ok = false; } else pE.classList.remove('show');
    if (pass !== conf)    { cE.textContent = 'Senhas não coincidem.';     cE.classList.add('show'); ok = false; } else cE.classList.remove('show');
    if (!ok) return;
    const r = await Auth.register(name, email, pass);
    if (r.ok) {
      showToast('Cadastro realizado! 🎉');
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    } else {
      eE.textContent = r.msg || 'Erro ao cadastrar.'; eE.classList.add('show');
    }
  });
}

/* ── Checkout (popula resumo — submit fica no inline) ────────── */
function initCheckout() {
  if (!document.getElementById('checkout-form')) return;
  const items    = Cart.get();
  const prods    = Products.getAll();
  const subtotal = Cart.total();
  const itemsEl  = document.getElementById('order-items');
  const totEl    = document.getElementById('order-total');
  const shipEl   = document.getElementById('order-shipping');
  const grandEl  = document.getElementById('order-grand-total');
  if (itemsEl) {
    itemsEl.innerHTML = items.map(item => {
      const p = prods.find(x => sameId(x.id, item.id));
      if (!p) return '';
      return `<div class="order-item">
        <img class="order-item-img" src="${p.img}" alt="${p.name}" onerror="this.src='${FALLBACK_IMG}'">
        <div>
          <div class="order-item-name">${p.name} ×${item.qty}</div>
          <div class="order-item-price">${formatPrice(p.price * item.qty)}</div>
        </div></div>`;
    }).join('');
  }
  if (totEl)   totEl.textContent   = formatPrice(subtotal);
  if (shipEl)  shipEl.textContent  = 'Informe o CEP';
  if (grandEl) grandEl.textContent = formatPrice(subtotal);
  window.addEventListener('products-updated', initCheckout);
}

/* ── Top-bar rotativa (mensagens de oferta) ─────────────────── */
function initTopbarRotator() {
  const bar = document.getElementById('top-bar');
  if (!bar) return;
  const msgs = [
    `🚚 <strong>FRETE GRÁTIS</strong> em compras acima de R$ ${FRETE_GRATIS_MIN}`,
    '🔥 Até <strong>50% OFF</strong> em peças selecionadas',
    '🔄 <strong>Troca fácil</strong> em até 30 dias',
  ];
  let i = 0;
  setInterval(() => {
    bar.classList.add('fading');
    setTimeout(() => {
      i = (i + 1) % msgs.length;
      bar.innerHTML = msgs[i];
      bar.classList.remove('fading');
    }, 400);
  }, 4500);
}

/* ── Botão flutuante de WhatsApp ────────────────────────────── */
function initWhatsAppButton() {
  const a = document.createElement('a');
  a.href = `https://wa.me/${WHATSAPP_NUM}?text=` + encodeURIComponent('Olá! Vim pelo site da LK Moda Masculina e tenho uma dúvida.');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.id = 'btn-whatsapp';
  a.setAttribute('aria-label', 'Falar no WhatsApp');
  a.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
  a.style.cssText = `
    position:fixed; bottom:24px; left:24px; z-index:9998;
    width:54px; height:54px; border-radius:50%;
    background:#25D366; display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 20px rgba(37,211,102,.45);
    transition:transform .2s, box-shadow .2s;
  `;
  a.onmouseenter = () => { a.style.transform = 'scale(1.08)'; a.style.boxShadow = '0 8px 28px rgba(37,211,102,.6)'; };
  a.onmouseleave = () => { a.style.transform = ''; a.style.boxShadow = '0 4px 20px rgba(37,211,102,.45)'; };
  document.body.appendChild(a);
}

/* ── Botão flutuante de rastreamento ────────────────────────── */
function initTrackingButton() {
  const btn = document.createElement('a');
  btn.href = 'https://rastreamento.correios.com.br/app/index.php';
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.id = 'btn-tracking';
  btn.innerHTML = `<span class="btn-tracking-icon">📦</span><span class="btn-tracking-label">Rastrear Pedido</span>`;
  btn.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    display:flex; align-items:center; gap:8px;
    background:#0a0a0a; color:#fff;
    padding:12px 18px; border-radius:50px;
    font-size:.85rem; font-weight:700; letter-spacing:.03em;
    text-decoration:none; box-shadow:0 4px 20px rgba(0,0,0,.35);
    transition:transform .2s, box-shadow .2s;
    border:1.5px solid rgba(255,255,255,.1);
  `;
  btn.onmouseenter = () => { btn.style.transform='translateY(-3px)'; btn.style.boxShadow='0 8px 28px rgba(0,0,0,.45)'; };
  btn.onmouseleave = () => { btn.style.transform=''; btn.style.boxShadow='0 4px 20px rgba(0,0,0,.35)'; };
  document.body.appendChild(btn);
}

/* ── Boot ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Inicia páginas imediatamente (carrinho/sessão já no localStorage) */
  initHeader();
  initHome();
  initProducts();
  initCart();
  initLogin();
  initCadastro();
  initTrackingButton();
  initWhatsAppButton();
  initTopbarRotator();
  initCheckout();

  /* Quando Firebase estiver pronto, inicia sync de produtos */
  function startSync() {
    Products.startSync();
  }

  if (window.FB) {
    startSync();
  } else {
    window.addEventListener('firebase-ready', startSync, { once: true });
  }

  /* 🔄 Re-sincroniza quando a página ganha foco (user volta para a aba) */
  window.addEventListener('focus', () => {
    console.log('👁️ Página ganhou foco - re-sincronizando...');
    if (window.FB) Products.startSync();
  });

  /* 🌐 Re-sincroniza quando voltar online */
  window.addEventListener('online', () => {
    console.log('🌐 Voltou online - re-sincronizando...');
    if (window.FB) Products.startSync();
  });

  /* � Escuta notificações de outras abas sobre mudanças em produtos */
  if (window.BroadcastChannel) {
    try {
      const channel = new BroadcastChannel('lkmodas-products');
      channel.addEventListener('message', (event) => {
        console.log('📢 Notificação de outra aba:', event.data);
        
        if (event.data.type === 'product-added') {
          console.log('🔄 Força re-sincronização por notificação inter-abas');
          if (window.FB) Products.startSync();
          
          // 🎉 Mostrar notificação visual do novo produto
          const prodName = event.data.name || 'Novo produto';
          showToast(`🆕 "${prodName}" adicionado à loja!`, 'success');
          
        } else if (event.data.type === 'product-updated') {
          console.log('🔄 Força re-sincronização por notificação inter-abas');
          if (window.FB) Products.startSync();
          
          // 📝 Mostrar notificação de atualização
          const prodName = event.data.name || 'Produto';
          showToast(`✏️ "${prodName}" foi atualizado!`, 'info');
          
        } else if (event.data.type === 'product-deleted') {
          console.log('🔄 Força re-sincronização por notificação inter-abas');
          if (window.FB) Products.startSync();
          
          // 🗑️ Mostrar notificação de remoção
          showToast('🗑️ Um produto foi removido da loja.', 'warning');
        }
      });
    } catch (e) {
      console.warn('BroadcastChannel não disponível:', e);
    }
  }

  /* �📡 Sincronização periódica a cada 60 segundos como fallback */
  setInterval(() => {
    if (window.FB && document.hidden) {
      console.log('📡 Sincronização periódica (página oculta)...');
      Products.startSync();
    }
  }, 60000);

  /* Modais */
  document.querySelectorAll('.modal-close').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
  });

  const goHome = document.getElementById('go-home');
  if (goHome) goHome.addEventListener('click', () => { window.location.href = 'index.html'; });

  /* Link ativo no nav */
  const cur = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a, .mobile-nav a').forEach(a => {
    if (a.getAttribute('href') === cur) a.classList.add('active');
  });
});