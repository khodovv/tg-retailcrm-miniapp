import express from 'express';
import { listProducts } from '../services/retailcrm.js';

const router = express.Router();

/**
 * GET /api/catalog?query=&page=1&limit=20
 * Возвращает продукты с нормализованными картинками и офферами (size/color в properties)
 */
router.get('/', async (req, res) => {
  try {
    const { query = '', page = 1, limit = 20 } = req.query;

    // Забираем из RetailCRM
    const data = await listProducts({
      query,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });

    // База для абсолютных URL (если CRM отдаёт относительные пути)
    const base = (process.env.RETAILCRM_URL || '').replace(/\/$/, '');
    const fix = (u) => {
      if (!u) return null;
      if (u.startsWith('http')) return u;
      if (u.startsWith('//')) return 'https:' + u;
      return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
    };

    const rawProducts = data?.products || data?.items || [];

    const products = rawProducts.map((p) => {
      // Картинки: поддержим разные поля, приводим к [{ url }]
      const images =
        (p.images || p.media || [])
          .map((img) => ({
            url: fix(img?.url || img?.largeUrl || img?.smallUrl || img?.path || img),
          }))
          .filter((i) => !!i.url) || [];

      // Офферы/варианты: приводим к общему виду
      const rawOffers = p.offers || p.variants || p.offer || [];
      const offers = rawOffers.map((o) => {
        // properties может быть объектом или массивом {name/value}
        let props = o.properties || o.props || o.attributes || {};
        if (Array.isArray(props)) {
          props = Object.fromEntries(
            props.map((pr) => [pr.code || pr.name, pr.value])
          );
        }
        return {
          externalId: o.externalId || o.xmlId || o.id,
          xmlId: o.xmlId,
          price:
            o.price ??
            o.prices?.price ??
            o.purchasePrice ??
            null,
          quantity: o.quantity ?? o.stock ?? 0,
          properties: props || {},
        };
      });

      // Минимальная цена
      let minPrice = p.minPrice ?? p.price ?? null;
      if (minPrice == null && offers.length) {
        const nums = offers.map((o) => Number(o.price)).filter((n) => !isNaN(n));
        if (nums.length) minPrice = Math.min(...nums);
      }

      return {
        id: p.id ?? p.externalId ?? p.code,
        name: p.name ?? p.title ?? 'Товар',
        minPrice,
        images,
        offers,
      };
    });

    res.json({
      ok: true,
      products,
      page: data?.page ?? Number(page) || 1,
      total: data?.total ?? products.length,
    });
  } catch (e) {
    console.error('GET /api/catalog error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
