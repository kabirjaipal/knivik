import { Request, Response } from 'express';
import { UserService } from '../services/userService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { getPaymentHistory, getActiveSubscription, getPrices } from '../lib/billing.js';
import logger from '../lib/logger.js';

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

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { username, metadata } = req.body;

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

  const user = await UserService.updateProfile(req.user.id, { username, metadata }, req.requestId);
  
  res.status(200).json({
    success: true,
    data: { user },
    message: 'Profile updated successfully',
    requestId: req.requestId,
  });
});

// Billing endpoints
export const getBillingHub = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const requestId = req.requestId;

  // Fetch prices for all users (even guests/unauthenticated if needed)
  const prices = await getPrices();

  // 1. If not logged in, return basic info
  if (!userId) {
    res.status(200).json({
      success: true,
      data: {
        user: null,
        subscription: null,
        payments: [],
        prices,
      },
      requestId,
    });
    return;
  }

  try {
    // 2. Fetch user-specific billing data
    const [payments, subscription, freshUser] = await Promise.all([
      getPaymentHistory(userId),
      getActiveSubscription(userId),
      UserService.getUserById(userId, requestId),
    ]);

    if (!freshUser) {
      res.status(404).json({
        success: false,
        error: { status: 404, code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: freshUser.id,
          email: freshUser.email,
          username: freshUser.username,
          plan: freshUser.plan,
          subscriptionStatus: freshUser.subscriptionStatus || (freshUser.plan === 'FREE' ? 'inactive' : 'active'),
          billingCycle: freshUser.billingCycle,
          currentPeriodEnd: freshUser.currentPeriodEnd,
          dodoCustomerId: freshUser.dodoCustomerId,
        },
        subscription,
        dodoSubscriptionId: subscription?.dodoSubscriptionId,
        payments,
        prices,
      },
      requestId,
    });
  } catch (error: any) {
    logger.error({ error, userId }, 'Failed to fetch billing hub data');
    res.status(500).json({
      success: false,
      error: { status: 500, code: 'INTERNAL_ERROR', message: 'Failed to retrieve billing data' },
    });
  }
});

export const getCustomerPortalUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { status: 401, code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
    return;
  }

  // Dodo Payments customer portal
  const portalUrl = "https://www.dodopayments.com/customer-portal"; 
  
  res.status(200).json({
    success: true,
    data: { url: portalUrl },
    requestId: req.requestId,
  });
});
