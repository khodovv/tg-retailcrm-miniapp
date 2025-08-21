import express from 'express';
import { listProducts } from '../services/retailcrm.js';

const router = express.Router();

// GET /api/catalog?query=&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const { query = '', page = 1, limit = 20 } = req.query;
    const data = await listProducts({ query, page, limit });
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;