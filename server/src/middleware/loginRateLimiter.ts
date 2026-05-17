import { rateLimit } from 'express-rate-limit';

/** Strict limiter for the login endpoint (5 attempts / 15 min). */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

/**
 * Strict limiter for AI generation endpoints to prevent budget abuse.
 * (3 requests / 10 minutes per IP).
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI analysis limit reached. Please wait 10 minutes before trying again.',
  },
});

/**
 * Moderate limiter for password-reset and email-verification endpoints.
 * These trigger emails / bcrypt work, so we keep them well-throttled.
 */
export const authActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again in an hour.',
  },
});

/** Lenient limiter for the register endpoint (10 accounts / 15 min per IP). */
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again in 15 minutes.',
  },
});

/** Strict limiter for submitting feedback (5 submissions per hour per IP). */
export const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many feedback submissions. Please try again later.',
  },
});

