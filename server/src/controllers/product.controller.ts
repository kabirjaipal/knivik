import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { z } from 'zod';
import { Platform } from '@prisma/client';
import { generateProductStrategy } from '../services/aiService.js';
import { SearchQueryService } from '../services/searchQueryService.js';

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
        keywords: true,
        negativeKeywords: true,
        competitors: true,
        sources: true,
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

    // Auto-generate strategy for users who submit empty or minimal configs (only global HN)
    const hasNoKeywords = data.keywords.length === 0;
    const hasOnlyGlobalSources = data.sources.length === 0 || 
      (data.sources.length === 1 && data.sources[0]?.platform === Platform.HACKERNEWS && data.sources[0]?.identifier === 'global');

    if (hasNoKeywords && hasOnlyGlobalSources && data.name) {
      try {
        const strategy = await generateProductStrategy(data.name, data.description || '', userId);
        if (strategy) {
          data.keywords = strategy.keywords || [];
          data.negativeKeywords = strategy.negativeKeywords || [];
          data.competitors = strategy.competitors || [];
          
          if (strategy.subreddits && strategy.subreddits.length > 0) {
            strategy.subreddits.forEach(sub => {
              data.sources.push({ platform: Platform.REDDIT, identifier: sub });
            });
          }

          if (strategy.twitterHandles && strategy.twitterHandles.length > 0) {
            strategy.twitterHandles.forEach(handle => {
              data.sources.push({ platform: Platform.TWITTER, identifier: handle.replace('@', '') });
            });
          }

          // if (strategy.linkedinSearchFlags && strategy.linkedinSearchFlags.length > 0) {
          //   strategy.linkedinSearchFlags.forEach(flag => {
          //     data.sources.push({ platform: "LINKEDIN" as any, identifier: flag });
          //   });
          // }

          // if (strategy.productHuntCommunities && strategy.productHuntCommunities.length > 0) {
          //   strategy.productHuntCommunities.forEach(topic => {
          //     data.sources.push({ platform: "PRODUCTHUNT" as any, identifier: topic });
          //   });
          // }

          // Always add HackerNews global
          data.sources.push({ platform: Platform.HACKERNEWS, identifier: 'global' });
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to auto-generate strategy during onboarding, applying fallback');
      }
      
      // Fallback if AI generation fails or returned no sources
      if (data.sources.length === 0) {
        data.sources = [
          { platform: Platform.REDDIT, identifier: 'SaaS' },
          { platform: Platform.REDDIT, identifier: 'startups' },
          { platform: Platform.HACKERNEWS, identifier: 'global' }
        ];
        data.keywords = [data.name];
      }
    }

    // Deduplicate sources and check for plan-restricted platforms
    const uniqueSourcesMap = new Map<string, { platform: Platform; identifier: string }>();
    const hasTwitter = data.sources.some(s => s.platform === Platform.TWITTER);
    const { hasCapability } = await import('../lib/plans.js');
    
    if (hasTwitter && (!user || !hasCapability(user.plan as any, 'canAccessTwitter'))) {
      res.status(403).json({ error: 'Twitter (X) tracking is only available on premium plans.' });
      return;
    }

    data.sources
      .filter((s): s is { platform: Platform; identifier: string } => !!s.platform && !!s.identifier)
      .forEach(s => {
        const key = `${s.platform}:${s.identifier}`;
        if (!uniqueSourcesMap.has(key)) {
          uniqueSourcesMap.set(key, s);
        }
      });
    data.sources = Array.from(uniqueSourcesMap.values());

    const product = await db.client.product.create({
      data: {
        userId,
        name: data.name,
        description: data.description || null,
        websiteUrl: data.websiteUrl || null,
        isActive: data.isActive,
        aiConfig: data.aiConfig || {},
        keywords: {
          create: [...new Set(data.keywords)].map((k) => ({ keyword: k })),
        },
        negativeKeywords: {
          create: [...new Set(data.negativeKeywords)].map((k) => ({ keyword: k })),
        },
        competitors: {
          create: [...new Set(data.competitors)].map((c) => ({ name: c })),
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

    // Generate AI search queries asynchronously (don't block response)
    setImmediate(async () => {
      try {
        await SearchQueryService.generateAndSaveQueries(product.id);
        logger.info({ productId: product.id }, 'Auto-generated search queries for new product');
      } catch (err) {
        logger.error({ err, productId: product.id }, 'Failed to auto-generate search queries');
      }
    });

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
    
    if (data.aiConfig?.['customPersona'] && (!user || !hasCap(user.plan as any, 'canAccessCustomPersonas'))) {
      // Strip out the custom persona if they don't have the capability, fail silently
      delete data.aiConfig['customPersona'];
    }

    // Deduplicate sources and check for plan-restricted platforms
    const uniqueSourcesMap = new Map<string, { platform: Platform; identifier: string }>();
    const hasTwitter = data.sources.some(s => s.platform === Platform.TWITTER);
    
    if (hasTwitter && (!user || !hasCap(user.plan as any, 'canAccessTwitter'))) {
      res.status(403).json({ error: 'Twitter (X) tracking is only available on premium plans.' });
      return;
    }

    data.sources
      .filter((s): s is { platform: Platform; identifier: string } => !!s.platform && !!s.identifier)
      .forEach(s => {
        const key = `${s.platform}:${s.identifier}`;
        if (!uniqueSourcesMap.has(key)) {
          uniqueSourcesMap.set(key, s);
        }
      });
    data.sources = Array.from(uniqueSourcesMap.values());

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
          // Clear old queries - will regenerate
          searchQueries: [],
          keywords: {
            create: [...new Set(data.keywords)].map((k) => ({ keyword: k })),
          },
          negativeKeywords: {
            create: [...new Set(data.negativeKeywords)].map((k) => ({ keyword: k })),
          },
          competitors: {
            create: [...new Set(data.competitors)].map((c) => ({ name: c })),
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

    // Regenerate AI search queries asynchronously after update
    setImmediate(async () => {
      try {
        await SearchQueryService.generateAndSaveQueries(productId);
        logger.info({ productId }, 'Regenerated search queries after product update');
      } catch (err) {
        logger.error({ err, productId }, 'Failed to regenerate search queries after update');
      }
    });

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
