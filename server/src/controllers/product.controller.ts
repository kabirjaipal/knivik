import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { z } from 'zod';
import { generateProductStrategy } from '../services/aiService.js';
import { SearchQueryService } from '../services/searchQueryService.js';
import { pipelineQueue } from '../lib/queue.js';

const productSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  aiConfig: z.record(z.string(), z.any()).optional(),
});

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const products = await db.client.product.findMany({
      where: { userId },
      include: {
        _count: {
          select: { leads: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Remove searchQueries from response to keep it backend-only
    const sanitizedProducts = products.map(p => {
      // @ts-ignore
      const { searchQueries, ...rest } = p;
      return rest;
    });
    
    res.status(200).json({ success: true, products: sanitizedProducts });
  } catch (error) {
    logger.error({ error }, 'Get Products error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const productId = req.params['id'] as string;
    if (!productId) {
      res.status(400).json({ error: 'Missing product ID' });
      return;
    }

    const product = await db.client.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: { leads: true }
        }
      },
    });

    if (!product || product.userId !== userId) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Remove searchQueries from response to keep it backend-only
    // @ts-ignore
    const { searchQueries, ...sanitizedProduct } = product;

    res.status(200).json({ success: true, product: sanitizedProduct });
  } catch (error) {
    logger.error({ error }, 'Get Product By ID error');
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

    // Check plan limits
    const user = await db.client.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const activeProductCount = await db.client.product.count({ where: { userId, isActive: true } });
    const { canAddProduct } = await import('../lib/plans.js');
    if (!canAddProduct(activeProductCount, user.plan as any)) {
      res.status(403).json({ error: 'Plan limits reached. Upgrade to track more products.' });
      return;
    }

    const cleanAiConfig: Record<string, any> = { ...(data.aiConfig || {}) };
    delete cleanAiConfig['lastManualScanDate'];
    delete cleanAiConfig['manualScansToday'];

    const product = await db.client.product.create({
      data: {
        userId,
        name: data.name,
        description: data.description || null,
        websiteUrl: data.websiteUrl || null,
        isActive: data.isActive,
        aiConfig: cleanAiConfig,
      },
      include: {
        _count: {
          select: { leads: true }
        }
      },
    });

    // Generate AI search queries synchronously so frontend waits for it
    try {
      await SearchQueryService.generateAndSaveQueries(product.id);
      logger.info({ productId: product.id }, 'Generated search queries for new product');
    } catch (err) {
      logger.error({ err, productId: product.id }, 'Failed to generate search queries');
    }

    // Remove searchQueries from response to keep it backend-only
    // @ts-ignore
    const { searchQueries: _, ...sanitizedProduct } = product;

    res.status(201).json({ success: true, product: sanitizedProduct });
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

    const productId = req.params['id'] as string;
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

    const user = await db.client.user.findUnique({ where: { id: userId } });
    const { hasCapability: hasCap } = await import('../lib/plans.js');
    
    const existingAiConfig = (existing.aiConfig as Record<string, any>) || {};
    const finalAiConfig: Record<string, any> = {
      ...(data.aiConfig || {}),
      // Preserve internal scan-tracking properties to prevent manual scan quota bypass
      lastManualScanDate: existingAiConfig['lastManualScanDate'],
      manualScansToday: existingAiConfig['manualScansToday'],
    };

    if (finalAiConfig['customPersona'] && (!user || !hasCap(user.plan as any, 'canAccessCustomPersonas'))) {
      // Strip out the custom persona if they don't have the capability, fail silently
      delete finalAiConfig['customPersona'];
    }

    // We'll use a transaction to cleanly overwrite the relations
    const updated = await db.client.$transaction(async (tx) => {
      // 2. Update parent and re-create nested records
      return tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          description: data.description || null,
          websiteUrl: data.websiteUrl || null,
          isActive: data.isActive,
          aiConfig: finalAiConfig,
          // Clear old queries - will regenerate
          searchQueries: [],
        },
        include: {
          _count: {
            select: { leads: true }
          }
        },
      });
    });

    // Regenerate AI search queries synchronously after update
    try {
      await SearchQueryService.generateAndSaveQueries(productId);
      logger.info({ productId }, 'Regenerated search queries after product update');
    } catch (err) {
      logger.error({ err, productId }, 'Failed to regenerate search queries after update');
    }

    // Remove searchQueries from response to keep it backend-only
    // @ts-ignore
    const { searchQueries: _, ...sanitizedUpdated } = updated;

    res.status(200).json({ success: true, product: sanitizedUpdated });
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

    const productId = req.params['id'] as string;

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

export const analyzeProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string | undefined;
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || !description || typeof description !== 'string') {
      res.status(400).json({ error: 'Name and description are required for AI analysis' });
      return;
    }
    // Enforce length limits to prevent prompt injection via oversized inputs
    if (name.length > 100) {
      res.status(400).json({ error: 'Product name must be 100 characters or fewer' });
      return;
    }
    if (description.length > 1000) {
      res.status(400).json({ error: 'Product description must be 1000 characters or fewer' });
      return;
    }

    const strategy = await generateProductStrategy(name, description, userId);
    res.status(200).json({ success: true, strategy });
  } catch (error) {
    logger.error({ error }, 'Analyze Product error');
    res.status(500).json({ error: 'AI analysis failed' });
  }
};

export const scanProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const productId = req.params['id'] as string;
    if (!productId) {
      res.status(400).json({ error: 'Missing product ID' });
      return;
    }

    const existing = await db.client.product.findUnique({ where: { id: productId } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Enforce daily manual scan quota per product based on User Plan tier
    const user = await db.client.user.findUnique({ where: { id: userId } });
    const { getPlanLimits } = await import('../lib/plans.js');
    const maxScans = user ? getPlanLimits(user.plan as any).manualScansPerDay : 0;

    if (maxScans <= 0) {
      res.status(403).json({
        error: 'Manual force scanning is a Pro feature. Your product is automatically scanned globally every 24 hours for free.'
      });
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // e.g. "2026-05-14"
    const aiConfig = (existing.aiConfig as Record<string, any>) || {};
    const lastScanDate = aiConfig['lastManualScanDate'];
    let scansToday = aiConfig['manualScansToday'] || 0;

    if (lastScanDate === todayStr) {
      if (scansToday >= maxScans) {
        const errorMsg = user && user.plan === 'PRO'
          ? `Daily manual scan quota reached (${maxScans}/${maxScans}) for this product.`
          : `Daily manual scan quota reached (1/1) on Free tier. Upgrade to Pro to unlock 10 manual scans/day + 2-hour automated background scans!`;
        res.status(429).json({ error: errorMsg });
        return;
      }
      scansToday++;
    } else {
      scansToday = 1;
    }

    // Persist incremented scan tracking
    await db.client.product.update({
      where: { id: productId },
      data: {
        aiConfig: {
          ...aiConfig,
          lastManualScanDate: todayStr,
          manualScansToday: scansToday
        }
      }
    });

    // Mark user as scanning in database
    await db.client.user.update({
      where: { id: userId },
      data: { isScanning: true }
    });

    // Add to background queue instead of awaiting (prevents Vercel/Proxy timeouts)
    await pipelineQueue.add('manual-scan', { userId, productId });

    res.status(202).json({ 
      success: true, 
      message: 'Scan started in background. New leads will appear in a few moments.' 
    });
  } catch (error: any) {
    logger.error({ error }, 'Scan Product error');
    res.status(500).json({ error: error.message || 'Manual scan failed' });
  }
};
