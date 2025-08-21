# Telegram Mini App + RetailCRM (Starter)

Готовый стартовый проект, чтобы продавать товары из RetailCRM прямо в Telegram:
- Mini App (веб-витрина внутри Telegram) — список, карточки, корзина.
- Оплата *в чате* через Telegram Payments (`sendInvoice`).
- После оплаты вы сможете создать заказ в RetailCRM и проставить оплату (заготовка в коде).

## 1) Быстрый старт (локально)

1. Установите Node.js 18+ и `npm i`
2. Скопируйте `.env.example` → `.env` и заполните:
   - `TELEGRAM_BOT_TOKEN` — у @BotFather
   - `TELEGRAM_PROVIDER_TOKEN` — у платёжного провайдера (тестовый можно сначала)
   - `PUBLIC_URL` — публичный HTTPS URL вашего сервера (для локальных тестов используйте ngrok)
   - `RETAILCRM_URL`, `RETAILCRM_API_KEY`, `RETAILCRM_SITE_CODE`
3. Запустите сервер:
   ```bash
   npm install
   npm run start
   ```
4. Пробросьте публичный адрес (например, ngrok):
   ```bash
   ngrok http 3000
   ```
   Пропишите выданный URL в `.env` как `PUBLIC_URL=https://...`
5. В @BotFather:
   - Включите Web App: команда `/setdomain` и укажите `PUBLIC_URL`
   - Установите web app кнопке URL: просто запустите бота `/start` — он покажет кнопку «Каталог»
6. Перейдите в чат с ботом → `/start` → откройте «Каталог» → добавьте товары → «Оплатить».
   Счёт придёт в чат бота.

> **Важно:** для оплаты пользователь должен открыть Mini App из *чата бота*, чтобы мы знали `user.id`.

## 2) Где править интеграцию с RetailCRM

- `src/services/retailcrm.js`
  - `listProducts` — подтягивает товары/офферы/цены/остатки
  - `getOfferByExternalId` — находит оффер по externalId
  - `createOrder`, `addPaymentToOrder` — создание заказа/платежа (вызовите их после успешной оплаты)

## 3) Платёжный флоу

1. Mini App → `/api/checkout` c `userId` и `items`
2. Сервер формирует `prices` и вызывает `sendInvoice`
3. Telegram присылает `shipping_query` → сервер отвечает вариантами доставки
4. Telegram присылает `pre_checkout_query` → сервер подтверждает
5. Пользователь оплачивает, приходит `successful_payment` → **здесь создайте заказ в RetailCRM** (заготовка в `src/bot.js`)

## 4) Что доделать под прод

- Проверка подписи `tg.initData` в веб-приложении (HMAC)
- Валидация остатков/цен перед `answerPreCheckoutQuery`
- Сохранение корзины/заказа в БД (Postgres/Redis) вместо памяти
- Подписка на вебхуки RetailCRM → уведомления пользователю о смене статуса заказа
- Промокоды/бонусы — рассчитать скидку до формирования счёта
- Логирование/трассировка, ретраи

## 5) Команды BotFather (опционально)
- `/setcommands`:
  ```
  start - Открыть каталог
  help - Помощь
  ```

## 6) Структура

```
src/
  bot.js                # логика бота: старт, доставка, pre-checkout, успешный платёж
  server.js             # express, вебхук, маршруты API
  routes/
    catalog.js
    cart.js
    checkout.js
    health.js
    webhooks.js         # заготовка под вебхуки RetailCRM
  services/
    retailcrm.js
    payment.js
    cartStore.js
  utils/logger.js
webapp/
  index.html
  app.js
  styles.css
.env.example
```

## 7) Подключение к вашему домену

Разместите на VPS/Render/Fly.io/Heroku. Установите переменные окружения из `.env`. Проверьте, что `PUBLIC_URL` доступен из интернета по HTTPS, иначе вебхук не установится.

---

Если нужно, добавлю:
- Создание заказа/платежа в RetailCRM после `successful_payment`
- Синхронизацию размеров/цветов и выбор оффера в карточке
- Интеграцию с СДЭК/Boxberry и расчётом доставки по адресу