import express from 'express';
import { getCart, setCart, clearCart } from '../services/cartStore.js';

const router = express.Router();

router.get('/', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ ok: false, error: 'userId required' });
  res.json({ ok: true, cart: getCart(userId) });
});

router.post('/', (req, res) => {
  const { userId, items } = req.body;
  if (!userId) return res.status(400).json({ ok:false, error:'userId required' });
  const cart = setCart(userId, { items: items || [] });
  res.json({ ok: true, cart });
});

router.delete('/', (req, res) => {
  const userId = req.query.userId;
  clearCart(userId);
  res.json({ ok: true });
});

export default router;