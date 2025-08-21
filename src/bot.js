import { Telegraf, Markup } from 'telegraf';

export function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');
  const bot = new Telegraf(token);

  // Кнопка открытия Mini App
  bot.start(async (ctx) => {
    const webappUrl = `${process.env.PUBLIC_URL}/webapp/`;
    await ctx.reply('Откройте каталог, чтобы выбрать товары:', 
      Markup.keyboard([
        [Markup.button.webApp('🛍 Каталог', webappUrl)]
      ]).resize()
    );
  });

  // Ответ на shipping_query
  bot.on('shipping_query', async (ctx) => {
    const id = ctx.update.shipping_query.id;
    // Здесь можно посчитать стоимость доставки по адресу
    const options = [
      {
        id: 'courier',
        title: 'Курьер',
        prices: [{ label: 'Доставка курьером', amount: 30000 }] // 300 ₽
      },
      {
        id: 'pickup',
        title: 'Самовывоз',
        prices: [{ label: 'Самовывоз', amount: 0 }]
      }
    ];
    await ctx.telegram.answerShippingQuery(id, true, options);
  });

  // Ответ на pre_checkout_query
  bot.on('pre_checkout_query', async (ctx) => {
    const id = ctx.update.pre_checkout_query.id;
    // Валидация корзины, остатков, ограничений — при необходимости
    await ctx.telegram.answerPreCheckoutQuery(id, true);
  });

  // Успешный платеж
  bot.on('message', async (ctx) => {
    const msg = ctx.message;
    if (msg.successful_payment) {
      try {
        const payload = JSON.parse(msg.successful_payment.invoice_payload || '{}');
        // Здесь создайте заказ в RetailCRM и пометьте оплату как paid
        // Чтобы не усложнять пример, просто благодарим
        await ctx.reply('Спасибо! Платёж получен. Мы собираем ваш заказ и скоро отправим уведомление со статусом.');
      } catch (e) {
        console.error('Payment payload parse error', e);
      }
    }
  });

  return bot;
}