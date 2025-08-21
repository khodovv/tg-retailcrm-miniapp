const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const API = (path) => `${location.origin}/api${path}`;

let state = {
  items: [], // {offerExternalId, qty}
  products: [],
};

const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const cartBtn = document.getElementById('cartBtn');
const payBtn = document.getElementById('payBtn');

function updateCartBadge() {
  const count = state.items.reduce((s,i)=>s+i.qty,0);
  cartBtn.textContent = `Корзина (${count})`;
}

function productCard(p) {
  const imgUrl = p.images?.[0]?.url || 'https://via.placeholder.com/600x800?text=Alexandra+Talalay';
  const offer = p.offers?.[0] || {};
  const offerExternalId = offer.externalId || offer.xmlId || (p.id+':default');

  const card = document.createElement('div');
  card.className = 'card';

  const img = document.createElement('img');
  img.src = imgUrl;
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

  // Кол-во
  const qtySel = document.createElement('select');
  for (let q=1;q<=5;q++){ 
    const opt=document.createElement('option');
    opt.value=q; opt.textContent=`Кол-во: ${q}`;
    qtySel.appendChild(opt);
  }
  body.appendChild(qtySel);

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Добавить в корзину';
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
  if (data.ok) {
    state.products = data.products;
    listEl.innerHTML = '';
    data.products.forEach(p => listEl.appendChild(productCard(p)));
  }
}

searchEl.addEventListener('input', (e) => {
  const q = e.target.value.trim();
  loadCatalog(q);
});

cartBtn.addEventListener('click', () => {
  const count = state.items.reduce((s,i)=>s+i.qty,0);
  alert(`В корзине позиций: ${count}`);
});

payBtn.addEventListener('click', async () => {
  if (state.items.length === 0) return alert('Корзина пуста');
  const userId = tg?.initDataUnsafe?.user?.id;
  if (!userId) return alert('Откройте Mini App из чата с ботом');

  const res = await fetch(API('/checkout'), {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      userId,
      items: state.items
    })
  });
  const data = await res.json();
  if (data.ok) {
    alert('Счёт отправлен в чат с ботом. Откройте Telegram-диалог и оплатите.');
    state.items = [];
    updateCartBadge();
  } else {
    alert('Ошибка: ' + (data.error || 'Не удалось сформировать платеж'));
  }
});

updateCartBadge();
loadCatalog();