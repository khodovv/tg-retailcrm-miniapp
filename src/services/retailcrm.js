import fetch from 'node-fetch';

const BASE = process.env.RETAILCRM_URL;
const API_KEY = process.env.RETAILCRM_API_KEY;
const SITE = process.env.RETAILCRM_SITE_CODE;

/**
 * Простой враппер для RetailCRM API
 */

function buildUrl(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('apiKey', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  return url.toString();
}

export async function listProducts({ limit = 20, page = 1, query = '' } = {}) {
  // /api/v4/store/products
  const url = buildUrl('/api/v4/store/products', { limit, page, name: query || undefined });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RetailCRM products error: ${res.status}`);
  const data = await res.json();
  // Нормализуем до минимально нужных полей
  const products = (data.products || []).map(p => ({
    id: p.id,
    name: p.name,
    offers: (p.offers || []).map(o => ({
      id: o.id,
      externalId: o.externalId,
      price: o.price,
      quantity: o.quantity,
      xmlId: o.xmlId,
      properties: o.properties
    })),
    images: p.images || [],
    article: p.article,
    description: p.description
  }));
  return { products, pagination: data.pagination || {} };
}

export async function getOfferByExternalId(externalId) {
  // В некоторых аккаунтах удобнее искать оффер через фильтр /store/products?offerExternalId=
  const url = buildUrl('/api/v4/store/products', { offerExternalId: externalId, limit: 1 });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RetailCRM offer lookup error: ${res.status}`);
  const data = await res.json();
  const product = (data.products || [])[0];
  if (!product) return null;
  const offer = (product.offers || []).find(o => o.externalId === externalId) || (product.offers || [])[0];
  return { product, offer };
}

export async function createOrder({ number, customer, items, delivery, payments }) {
  // /api/v5/orders/create
  const url = buildUrl('/api/v5/orders/create');
  const body = { site: SITE, order: {
    number, customer, items, delivery, payments
  }};
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data && data.success === false)) {
    throw new Error(`RetailCRM createOrder error: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

export async function addPaymentToOrder(orderId, payment) {
  // /api/v5/orders/payments/create
  const url = buildUrl('/api/v5/orders/payments/create');
  const body = {
    payment: {
      order: { id: orderId },
      ...payment
    }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data && data.success === false)) {
    throw new Error(`RetailCRM addPayment error: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}