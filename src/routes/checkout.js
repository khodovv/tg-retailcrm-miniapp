import express from 'express';
import { buildInvoice } from '../services/payment.js';

const router = express.Router();

/**
 * Mini App -> POST /api/checkout
 * body: { userId, items:[{offerExternalId, qty}], shippingRequired?: true }
 * Сервер формирует invoice и отправляет его в чат пользователя
 */
router.post('/', async (req, res) => {
  try {
    const { userId, items, photoUrl } = req.body;
    if (!userId || !Array.isArray(items)) {
      return res.status(400).json({ ok:false, error:'userId and items required' });
    }

    const { prices, total } = await buildInvoice({ items });

    // Отправляем счёт пользователю
    const { bot } = req.app.locals;
    const providerToken = process.env.TELEGRAM_PROVIDER_TOKEN;
    const payload = JSON.stringify({ items });

    await bot.telegram.sendInvoice(userId, {
      title: 'Оплата заказа Alexandra Talalay',
      description: 'Покупка товаров в Telegram',
      payload,
      provider_token: providerToken,
      currency: 'RUB',
      prices,
      photo_url: photoUrl || undefined,
      need_phone_number: true,
      need_email: true,
      need_shipping_address: true,
      is_flexible: true
    });

    res.json({ ok: true, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

export default router;