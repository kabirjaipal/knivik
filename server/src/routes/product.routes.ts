import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, analyzeProduct, scanProduct } from '../controllers/product.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/loginRateLimiter.js';

const router = Router();

router.use(requireAuth);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.post('/analyze', aiLimiter, analyzeProduct);
router.post('/:id/scan', scanProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);


export default router;
