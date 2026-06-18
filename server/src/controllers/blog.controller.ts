import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { z } from 'zod';

const blogPostValidationSchema = z.object({
  slug: z.string().min(1, 'Slug is required').max(100),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(1000),
  content: z.string().min(1, 'Content is required'),
  coverImage: z.string().min(1, 'Cover image is required'),
  readTime: z.string().min(1, 'Read time is required').max(50),
  category: z.string().min(1, 'Category is required').max(100),
  tags: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

/**
 * Get all blog posts
 * GET /api/blog
 */
export const getAllBlogPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, published } = req.query;

    // Build filter: public routes pass ?published=true to see only live posts
    const statusFilter = published === 'true' ? { status: 'PUBLISHED' as const } : undefined;
    const categoryFilter = category ? { category: String(category) } : undefined;

    const posts = await db.client.blogPost.findMany({
      where: {
        ...statusFilter,
        ...categoryFilter,
      },
      orderBy: { date: 'desc' },
      include: {
        createdBy: {
          select: {
            username: true,
            displayUsername: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    logger.error({ error }, 'Get all blog posts error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Get single blog post by slug
 * GET /api/blog/:slug
 */
export const getBlogPostBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    
    const post = await db.client.blogPost.findFirst({
      where: {
        OR: [
          { id: slug },
          { slug: slug },
        ],
      },
    });

    if (!post) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    logger.error({ error, slug: req.params.slug }, 'Get blog post by slug error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Serve blog post cover image as binary (to support base64 images in OpenGraph tags)
 * GET /api/blog/:slug/image
 */
export const getBlogPostImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    
    const post = await db.client.blogPost.findFirst({
      where: {
        OR: [
          { id: slug },
          { slug: slug },
        ],
      },
      select: {
        coverImage: true,
      },
    });

    if (!post || !post.coverImage) {
      res.status(404).send('Image not found');
      return;
    }

    // Check if it is a base64 data URI
    const match = post.coverImage.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      // If it's already a normal URL, redirect to it
      res.redirect(301, post.coverImage);
      return;
    }

    const contentType = match[1];
    const base64Data = match[2];
    const imgBuffer = Buffer.from(base64Data, 'base64');

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': imgBuffer.length,
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(imgBuffer);
  } catch (error) {
    logger.error({ error, slug: req.params.slug }, 'Get blog post image error');
    res.status(500).send('Internal server error');
  }
};

/**
 * Create a new blog post (Admin Only)
 * POST /api/blog
 */
export const createBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const parsed = blogPostValidationSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid inputs',
        details: parsed.error.issues,
      });
      return;
    }

    // Check slug uniqueness
    const existing = await db.client.blogPost.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'A blog post with this slug already exists',
      });
      return;
    }

    const post = await db.client.blogPost.create({
      data: {
        ...parsed.data,
        createdById: userId,
      },
    });

    logger.info({ postId: post.id, slug: post.slug }, 'Blog post created successfully');

    res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    logger.error({ error }, 'Create blog post error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Update an existing blog post (Admin Only)
 * PUT /api/blog/:id
 */
export const updateBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const parsed = blogPostValidationSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid inputs',
        details: parsed.error.issues,
      });
      return;
    }

    const existingPost = await db.client.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    // If slug is changed, check uniqueness
    if (parsed.data.slug !== existingPost.slug) {
      const slugConflict = await db.client.blogPost.findUnique({
        where: { slug: parsed.data.slug },
      });
      
      if (slugConflict) {
        res.status(400).json({
          success: false,
          error: 'A blog post with this slug already exists',
        });
        return;
      }
    }

    const updated = await db.client.blogPost.update({
      where: { id },
      data: {
        ...parsed.data,
      },
    });

    logger.info({ postId: id, slug: updated.slug }, 'Blog post updated successfully');

    res.status(200).json({
      success: true,
      post: updated,
    });
  } catch (error) {
    logger.error({ error, postId: req.params.id }, 'Update blog post error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Delete a blog post (Admin Only)
 * DELETE /api/blog/:id
 */
export const deleteBlogPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await db.client.blogPost.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    await db.client.blogPost.delete({
      where: { id },
    });

    logger.info({ postId: id, slug: existing.slug }, 'Blog post deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    logger.error({ error, postId: req.params.id }, 'Delete blog post error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
