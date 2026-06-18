import { Router } from 'express';
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getBlogPostImage,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../controllers/blog.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public Routes
router.get('/', getAllBlogPosts);
router.get('/:slug', getBlogPostBySlug);
router.get('/:slug/image', getBlogPostImage);

// Admin-Only Protected Routes
router.post('/', requireAuth, requireAdmin, createBlogPost);
router.put('/:id', requireAuth, requireAdmin, updateBlogPost);
router.delete('/:id', requireAuth, requireAdmin, deleteBlogPost);

export default router;
