import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { z } from 'zod';
import { Platform } from '@prisma/client';

const productSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  aiConfig: z.record(z.any()).optional(),
  keywords: z.array(z.string()).default([]),
  negativeKeywords: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
  sources: z.array(z.object({
    platform: z.nativeEnum(Platform),
    identifier: z.string().min(1),
  })).default([]),
});

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const products = await db.client.product.findMany({
      where: { userId },
      include: {
        keywords: true,
        negativeKeywords: true,
        competitors: true,
        sources: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, products });
  } catch (error) {
    logger.error({ error }, 'Get Products error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const parsed = productSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
      return;
    }

    const data = parsed.data;

    const product = await db.client.product.create({
      data: {
        userId,
        name: data.name,
        description: data.description || null,
        websiteUrl: data.websiteUrl || null,
        isActive: data.isActive,
        aiConfig: data.aiConfig || {},
        keywords: {
          create: data.keywords.map((k) => ({ keyword: k })),
        },
        negativeKeywords: {
          create: data.negativeKeywords.map((k) => ({ keyword: k })),
        },
        competitors: {
          create: data.competitors.map((c) => ({ name: c })),
        },
        sources: {
          create: data.sources.map((s) => ({ platform: s.platform, identifier: s.identifier })),
        },
      },
      include: {
        keywords: true,
        negativeKeywords: true,
        competitors: true,
        sources: true,
      },
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    logger.error({ error }, 'Create Product error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const productId = req.params['id'];
    const parsed = productSchema.safeParse(req.body);

    if (!parsed.success || !productId) {
      res.status(400).json({ error: 'Invalid input or missing ID', details: parsed.error?.issues });
      return;
    }

    // Verify ownership
    const existing = await db.client.product.findUnique({ where: { id: productId } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const data = parsed.data;

    // We'll use a transaction to cleanly overwrite the relations
    const updated = await db.client.$transaction(async (tx) => {
      // 1. Delete associated nested records
      await tx.keyword.deleteMany({ where: { productId } });
      await tx.negativeKeyword.deleteMany({ where: { productId } });
      await tx.competitor.deleteMany({ where: { productId } });
      await tx.productSource.deleteMany({ where: { productId } });

      // 2. Update parent and re-create nested records
      return tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          description: data.description || null,
          websiteUrl: data.websiteUrl || null,
          isActive: data.isActive,
          aiConfig: data.aiConfig || {},
          keywords: {
            create: data.keywords.map((k) => ({ keyword: k })),
          },
          negativeKeywords: {
            create: data.negativeKeywords.map((k) => ({ keyword: k })),
          },
          competitors: {
            create: data.competitors.map((c) => ({ name: c })),
          },
          sources: {
            create: data.sources.map((s) => ({ platform: s.platform, identifier: s.identifier })),
          },
        },
        include: {
          keywords: true,
          negativeKeywords: true,
          competitors: true,
          sources: true,
        },
      });
    });

    res.status(200).json({ success: true, product: updated });
  } catch (error) {
    logger.error({ error }, 'Update Product error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const productId = req.params['id'];

    if (!productId) {
      res.status(400).json({ error: 'Missing product ID' });
      return;
    }

    const existing = await db.client.product.findUnique({ where: { id: productId } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await db.client.product.delete({ where: { id: productId } });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    logger.error({ error }, 'Delete Product error');
    res.status(500).json({ error: 'Internal server error' });
  }
};
