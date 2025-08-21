/**
 * Очень простой in-memory storage корзин: { userId: {items:[], delivery:{}, total:0} }
 * Для продакшена замените на Redis/Postgres.
 */
const carts = new Map();

export function getCart(userId) {
  if (!carts.has(userId)) carts.set(userId, { items: [], updatedAt: Date.now() });
  return carts.get(userId);
}

export function setCart(userId, cart) {
  carts.set(userId, { ...cart, updatedAt: Date.now() });
  return carts.get(userId);
}

export function clearCart(userId) {
  carts.delete(userId);
}