import morgan from 'morgan';

export function attachLogger(app) {
  const format = process.env.LOG_LEVEL || 'dev';
  app.use(morgan(format));
}