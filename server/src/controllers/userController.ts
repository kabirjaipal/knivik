import { Request, Response } from 'express';
import { UserService } from '../services/userService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { getPaymentHistory, getActiveSubscription } from '../lib/billing.js';
import logger from '../lib/logger.js';
import paddle from '../lib/paddle.js';

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.createUser(req.body, req.requestId);
  
  res.status(201).json({
    success: true,
    data: { user },
    requestId: req.requestId,
  });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await UserService.login(req.body, req.requestId);
  
  res.status(200).json({
    success: true,
    data: result,
    requestId: req.requestId,
  });
});

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
    requestId: req.requestId,
  });
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await UserService.getAllUsers(req.requestId);
  
  res.status(200).json({
    success: true,
    data: { users, count: users.length },
    requestId: req.requestId,
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.params['id'] as string;
  if (!userId) {
    res.status(400).json({
      success: false,
      error: {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'User ID is required',
        requestId: req.requestId,
      },
      requestId: req.requestId,
    });
    return;
  }

  const user = await UserService.getUserById(userId, req.requestId as string | undefined);
  
  if (!user) {
    res.status(404).json({
      success: false,
      error: {
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        requestId: req.requestId,
      },
      requestId: req.requestId,
    });
    return;
  }
  
  res.status(200).json({
    success: true,
    data: { user },
    requestId: req.requestId,
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.params['id'] as string;
  if (!userId) {
    res.status(400).json({
      success: false,
      error: {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'User ID is required',
        requestId: req.requestId,
      },
      requestId: req.requestId,
    });
    return;
  }

  await UserService.deleteUser(userId, req.requestId as string | undefined);
  
  res.status(204).send();
});

export const updatePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      error: {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Current and new passwords are required',
        requestId: req.requestId,
      },
      requestId: req.requestId,
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'User session expired or invalid',
        requestId: req.requestId,
      },
      requestId: req.requestId,
    });
    return;
  }

  await UserService.updatePassword(req.user.id, currentPassword, newPassword, req.requestId);
  
  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    requestId: req.requestId,
  });
});

// Billing endpoints
export const getBillingInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { status: 401, code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
    return;
  }

  const [payments, subscription] = await Promise.all([
    getPaymentHistory(req.user.id),
    getActiveSubscription(req.user.id),
  ]);

  res.status(200).json({
    success: true,
    data: {
      plan: req.user.plan,
      subscriptionStatus: req.user.subscriptionStatus || (req.user.plan === 'FREE' ? 'active' : null),
      billingCycle: req.user.billingCycle,
      currentPeriodEnd: req.user.currentPeriodEnd,
      paddleCustomerId: req.user.paddleCustomerId,
      subscription,
      payments,
    },
    requestId: req.requestId,
  });
});

export const createCustomerPortal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.paddleCustomerId) {
    res.status(400).json({
      success: false,
      error: { status: 400, code: 'BAD_REQUEST', message: 'No active subscription found' },
    });
    return;
  }

  try {
    // Generate an authenticated customer portal session via Paddle SDK
    const session = await paddle.customerPortalSessions.create(req.user.paddleCustomerId, []);
    const portalUrl = session.urls.general.overview;
    
    res.status(200).json({
      success: true,
      data: { url: portalUrl },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error({ error, userId: req.user.id }, 'Failed to create customer portal session');
    res.status(error.status || 500).json({
      success: false,
      error: { 
        status: error.status || 500, 
        code: 'PADDLE_ERROR', 
        message: error.message || 'Failed to generate billing session. Please try again later.' 
      },
    });
  }
});

export const getPrices = asyncHandler(async (req: Request, res: Response) => {
  try {
    const prices = await paddle.prices.list({
      status: ['active'],
    });
    
    let result = [];
    for await (const price of prices) {
      result.push({
        id: price.id,
        productId: price.productId,
        name: price.name,
        amount: parseInt(price.unitPrice.amount, 10),
        currency: price.unitPrice.currencyCode,
        billingCycle: price.billingCycle,
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch prices from Paddle');
    res.status(500).json({
      success: false,
      error: { status: 500, code: 'INTERNAL_ERROR', message: 'Failed to retrieve pricing data' },
    });
  }
});
