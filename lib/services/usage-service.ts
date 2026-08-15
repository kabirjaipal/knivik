import { db } from '../db';
import { PLANS, PlanKey } from '../plans';
import type { UserPlan } from '@prisma/client';

/**
 * Checks if a user can add more leads this month based on their plan limits.
 */
export async function checkLeadQuota(userId: string, plan: UserPlan | string): Promise<boolean> {
  const planKey = plan as PlanKey;
  const planConfig = PLANS[planKey];
  if (!planConfig) return false;
  
  const limit = planConfig.limits.leadsPerMonth;
  if (limit <= 0) return false; 

  const now = new Date();
  const usage = await db.client.usageRecord.findUnique({
    where: {
      userId_type_month_year: {
        userId,
        type: 'leads',
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
  });

  return (usage?.count || 0) < limit;
}

/**
 * Increments the monthly lead usage for a user.
 */
export async function incrementLeadUsage(userId: string): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await db.client.usageRecord.upsert({
    where: {
      userId_type_month_year: {
        userId,
        type: 'leads',
        month,
        year,
      },
    },
    create: {
      userId,
      type: 'leads',
      month,
      year,
      count: 1,
    },
    update: {
      count: { increment: 1 },
    },
  });
}
