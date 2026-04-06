import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, analyzeProduct } from '../controllers/product.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.post('/analyze', analyzeProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
