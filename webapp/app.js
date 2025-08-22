// Telegram WebApp
const tg = window.Telegram?.WebApp;
try { tg?.ready(); tg?.expand(); } catch(e){}

// === БРЕНД-КОНСТАНТЫ (можешь поменять) ===
const BRAND_TITLE = "Alexandra Talalay";
const BRAND_SUBTITLE = "Минимализм с нотками old money";
const HERO_IMAGE_URL = "hero.jpg?v=2";
const PROMO_CHIPS = [
  { label: "Новинки", q: "" },
  { label: "Платья", q: "плать" },
  { label: "Костюмы", q: "костюм" },
  { label: "Трикотаж", q: "трикот" }
];

// === ЭЛЕМЕНТЫ ===
const homeEl = document.getElementById('home');
const headerEl = document.getElementById('header');
const backBtn = document.getElementById('backBtn');
const chipsEl = document.getElementById('chips');
const listEl = document.getElementById('list');
const footerEl = document.getElementById('footer');
const searchEl = document.getElementById('search');
const cartBtn = document.getElementById('cartBtn');
const payBtn = document.getElementById('payBtn');

const API = (path) => `${location.origin}/api${path}`;
let state = { view: 'home', items: [], products: [] };

// --- helpers ---
const uniq = (arr) => [...new Set(arr.filter(Boolean))];

const norm = (u) => {
  if (!u) return null;
  if (u.startsWith('http')) return u;
  if (u.startsWith('//')) return 'https:' + u;
  const host = new URL(location.origin);
  return `${host.protocol}//${host.host}${u.startsWith('/') ? '' : '/'}${u}`;
};

// извлекаем свойства оффера "Размер/Цвет"
function offerProps(offer) {
  const p = (offer.properties || offer.props || {});
  const entries = Object.entries(p).map(([k, v]) => [String(k).toLowerCase(), v]);
  const find = (keys) => {
    const i = entries.findIndex(([k]) => keys.includes(k));
    return i > -1 ? entries[i][1] : undefined;
  };
  return {
    size: p.size || p.Размер || p['размер'] || find(['size','размер','рост']),
    color: p.color || p.Цвет || p['цвет'] || find(['color','цвет','колор'])
  };
}


function show(el){ el?.classList.remove('hidden'); }
function hide(el){ el?.classList.add('hidden'); }
function updateCartBadge() {
  const count = state.items.reduce((s,i)=>s+i.qty,0);
  cartBtn.textContent = `Корзина (${count})`;
}

// === HOME ===
function renderHome() {
  state.view = 'home';
  hide(headerEl); hide(chipsEl); hide(listEl); hide(footerEl);
  backBtn?.classList.add('hidden');
  if (tg?.BackButton) tg.BackButton.hide();

  homeEl.innerHTML = `
    <div class="hero" style="background-image:url('${HERO_IMAGE_URL}');">
      <div class="hero-inner">
        <div class="brand">${BRAND_TITLE}</div>
        <div class="subtitle">${BRAND_SUBTITLE}</div>
        <div class="cta">
          <button id="openCatalog" class="btn">Смотреть каталог</button>
          <button id="openCart" class="btn btn-outline">Корзина (${state.items.reduce((s,i)=>s+i.qty,0)})</button>
        </div>
      </div>
    </div>
    <div class="features">
      <div class="feature">Собственное производство</div>
      <div class="feature">Доставка по РФ</div>
      <div class="feature">Оплата в Telegram</div>
      <div class="feature">Поддержка 7/7</div>
    </div>
  `;
  document.getElementById('openCatalog').onclick = () => renderCatalog();
  document.getElementById('openCart').onclick = () => alert(`В корзине позиций: ${state.items.reduce((s,i)=>s+i.qty,0)}`);
}

// === CATALOG ===
function renderChips() {
  chipsEl.innerHTML = '';
  PROMO_CHIPS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = c.label;
    b.onclick = () => { searchEl.value = c.q; loadCatalog(c.q); };
    chipsEl.appendChild(b);
  });
}

function renderCatalog() {
  state.view = 'catalog';
  show(headerEl); show(chipsEl); show(listEl); show(footerEl);
  renderChips();
  backBtn?.classList.remove('hidden');
  if (tg?.BackButton) {
    tg.BackButton.show();
    tg.BackButton.onClick(() => renderHome());
  }
  loadCatalog(searchEl.value.trim());
}

function productCard(p) {
  const imgUrl = p.images?.[0]?.url || 'https://via.placeholder.com/600x800?text=Alexandra+Talalay';
  const offer = p.offers?.[0] || {};
  const offerExternalId = offer.externalId || offer.xmlId || (p.id+':default');

  const card = document.createElement('div');
  card.className = 'card';

  const img = document.createElement('img');
  img.src = imgUrl;
  img.alt = p.name;
  card.appendChild(img);

  const body = document.createElement('div');
  body.className = 'body';

  const h3 = document.createElement('h3');
  h3.textContent = p.name;
  body.appendChild(h3);

  const price = document.createElement('div');
  price.className = 'price';
  price.textContent = `${offer.price ?? '-'} ₽`;
  body.appendChild(price);

  const qtySel = document.createElement('select');
  for (let q=1;q<=5;q++){ 
    const opt=document.createElement('option');
    opt.value=q; opt.textContent=`Кол-во: ${q}`;
    qtySel.appendChild(opt);
  }
  body.appendChild(qtySel);

  const addBtn = document.createElement('button');
  addBtn.textContent = 'В корзину';
  addBtn.onclick = () => {
    state.items.push({ offerExternalId, qty: parseInt(qtySel.value,10) });
    updateCartBadge();
    if (tg) tg.HapticFeedback?.notificationOccurred('success');
  };
  body.appendChild(addBtn);

  card.appendChild(body);
  return card;
}

async function loadCatalog(q='') {
  const url = new URL(API('/catalog'));
  if (q) url.searchParams.set('query', q);
  const res = await fetch(url);
  const data = await res.json();
  listEl.innerHTML = '';
  if (data.ok && data.products?.length) {
    state.products = data.products;
    data.products.forEach(p => listEl.appendChild(productCard(p)));
  } else {
    const empty = document.createElement('div');
    empty.style.padding = '20px';
    empty.textContent = 'Ничего не найдено.';
    listEl.appendChild(empty);
  }
}

// === EVENTS ===
searchEl.addEventListener('input', (e) => loadCatalog(e.target.value.trim()));
backBtn.addEventListener('click', () => renderHome());
cartBtn.addEventListener('click', () => {
  const count = state.items.reduce((s,i)=>s+i.qty,0);
  alert(`В корзине позиций: ${count}`);
});
payBtn.addEventListener('click', async () => {
  if (state.items.length === 0) return alert('Корзина пуста');
  const userId = tg?.initDataUnsafe?.user?.id;
  if (!userId) return alert('Откройте Mini App из чата с ботом');

  const res = await fetch(API('/checkout'), {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ userId, items: state.items })
  });
  const data = await res.json();
  if (data.ok) {
    alert('Счёт отправлен в чат с ботом. Откройте диалог и оплатите.');
    state.items = []; updateCartBadge();
  } else {
    alert('Ошибка: ' + (data.error || 'Не удалось сформировать платёж'));
  }
});

// === START ===
updateCartBadge();
renderHome();
