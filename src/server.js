import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { attachLogger } from './utils/logger.js';
import catalogRouter from './routes/catalog.js';
import cartRouter from './routes/cart.js';
import checkoutRouter from './routes/checkout.js';
import healthRouter from './routes/health.js';
import webhooksRouter from './routes/webhooks.js';
import { createBot } from './bot.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
attachLogger(app);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Telegram bot
const bot = createBot();
app.locals.bot = bot;

// Вебхук
const secret = process.env.WEBHOOK_SECRET || 'secret';
const webhookPath = `/tg/webhook/${secret}`;
app.use(webhookPath, bot.webhookCallback(webhookPath));

(async () => {
  // Установим вебхук при старте
  const publicUrl = process.env.PUBLIC_URL;
  if (publicUrl) {
    const url = `${publicUrl}${webhookPath}`;
    await bot.telegram.setWebhook(url);
    console.log('Webhook set to', url);
  } else {
    console.warn('PUBLIC_URL не задан — вебхук не будет установлен.');
  }
})().catch(console.error);

// API
app.use('/api/catalog', catalogRouter);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api', healthRouter);
app.use('/webhooks', webhooksRouter);

// Выдача Mini App
app.use('/webapp', express.static(path.join(__dirname, '..', 'webapp')));

// Root
app.get('/', (req, res) => res.send('TG + RetailCRM Mini App is running'));

// Start
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));