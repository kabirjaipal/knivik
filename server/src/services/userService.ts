import { z } from 'zod';
import { db } from '../lib/db.js';
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import { AppError } from '../middleware/errorHandler.js';
import type { CreateUserInput, LoginInput, User } from '../types/index.js';

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  role: z.string().optional().default('user'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class UserService {
  static async createUser(input: CreateUserInput, requestId?: string): Promise<User> {
    const validation = createUserSchema.safeParse(input);
    if (!validation.success) {
      throw new AppError('Invalid input data', 400, 'VALIDATION_ERROR', requestId);
    }

    const { email, username, password, role } = validation.data;

    // Check if user already exists
    const existingUser = await db.client.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      throw new AppError('User already exists', 409, 'USER_EXISTS', requestId);
    }

    // Create user properly via Better Auth API
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: username,
        username,
      },
    });

    if (!signUpResult || !signUpResult.user) {
      throw new AppError('Failed to create user via authentication service', 500, 'AUTH_ERROR', requestId);
    }

    // Update role and set email verified to true for created users
    const user = await db.client.user.update({
      where: { id: signUpResult.user.id },
      data: {
        role: role as any,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        plan: true,
        metadata: true,
        subscriptionStatus: true,
        billingCycle: true,
        currentPeriodEnd: true,
        dodoCustomerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async login(input: LoginInput, requestId?: string): Promise<{ user: User; token: string }> {
    const validation = loginSchema.safeParse(input);
    if (!validation.success) {
      throw new AppError('Invalid input data', 400, 'VALIDATION_ERROR', requestId);
    }

    const { email, password } = validation.data;

    try {
      const result = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
      });

      if (!result || !result.user || !result.token) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS', requestId);
      }

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username || '',
          role: result.user.role as any,
          plan: result.user.plan as any,
          metadata: result.user.metadata,
          subscriptionStatus: result.user.subscriptionStatus || null,
          billingCycle: null,
          currentPeriodEnd: null,
          dodoCustomerId: null,
          createdAt: new Date(result.user.createdAt),
          updatedAt: new Date(result.user.updatedAt),
        },
        token: result.token,
      };
    } catch {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS', requestId);
    }
  }

  static async getUserById(id: string, _requestId?: string): Promise<User | null> {
    return db.client.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        plan: true,
        metadata: true,
        subscriptionStatus: true,
        billingCycle: true,
        currentPeriodEnd: true,
        dodoCustomerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async getAllUsers(_requestId?: string): Promise<User[]> {
    return db.client.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        plan: true,
        metadata: true,
        subscriptionStatus: true,
        billingCycle: true,
        currentPeriodEnd: true,
        dodoCustomerId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async deleteUser(id: string, requestId?: string): Promise<void> {
    const user = await db.client.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND', requestId);
    }

    await db.client.user.delete({
      where: { id },
    });
  }

  static async updatePassword(headers: any, currentPassword: string, newPassword: string, requestId?: string): Promise<void> {
    try {
      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        },
        headers: fromNodeHeaders(headers),
      });
    } catch (err: any) {
      throw new AppError(err.message || 'Failed to update password', 400, 'PASSWORD_UPDATE_FAILED', requestId);
    }
  }

  static async updateProfile(userId: string, input: { username?: string, metadata?: any }, _requestId?: string): Promise<User> {
    return db.client.user.update({
      where: { id: userId },
      data: {
        ...(input.username && { username: input.username }),
        ...(input.metadata !== undefined && { metadata: input.metadata }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        plan: true,
        metadata: true,
        subscriptionStatus: true,
        billingCycle: true,
        currentPeriodEnd: true,
        dodoCustomerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
