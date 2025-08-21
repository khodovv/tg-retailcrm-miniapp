import express from 'express';
const router = express.Router();

// Заготовка под вебхуки RetailCRM (статусы заказов и т.п.)
router.post('/retailcrm', (req, res) => {
  // TODO: проверьте подпись, обработайте событие и отправьте уведомление пользователю
  // req.body содержит событие
  res.json({ ok: true });
});

export default router;