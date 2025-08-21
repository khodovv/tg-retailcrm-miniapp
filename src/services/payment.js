import { getOfferByExternalId } from './retailcrm.js';

/**
 * Рассчитывает позиции для Telegram Invoice
 */
export async function buildInvoice({ items }) {
  // items: [{ offerExternalId, qty }]
  let total = 0;
  const lineItems = [];
  for (const i of items) {
    const info = await getOfferByExternalId(i.offerExternalId);
    if (!info) throw new Error(`Offer not found: ${i.offerExternalId}`);
    const price = Math.round((info.offer.price || 0) * 100); // kopecks
    const amount = price * i.qty;
    total += amount;
    lineItems.push({
      label: info.product.name,
      amount
    });
  }
  return { prices: lineItems, total };
}