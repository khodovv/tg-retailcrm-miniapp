# Примечание по ngrok

Установите ngrok и выполните:
```
ngrok http 3000
```
Возьмите выданный https-URL и вставьте в `.env` как PUBLIC_URL.
Перезапустите сервер, чтобы он установил вебхук на `${PUBLIC_URL}/tg/webhook/${WEBHOOK_SECRET}`.