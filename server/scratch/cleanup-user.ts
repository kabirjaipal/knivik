import { db } from '../src/lib/db.js';
import paddle from '../src/lib/paddle.js';
import logger from '../src/lib/logger.js';

async function cleanup() {
  const email = 'kabir@knivik.com';
  console.log(`🧹 Starting cleanup for ${email}...`);

  const user = await db.client.user.findUnique({
    where: { email },
    include: { subscriptions: true }
  });

  if (!user) {
    console.log('❌ User not found in database.');
    return;
  }

  let paddleCustomerId = user.paddleCustomerId;

  // If ID is missing from DB (after reset), try to find them in Paddle by email
  if (!paddleCustomerId) {
    console.log(`🔍 Customer ID missing from DB. Searching Paddle by email: ${email}...`);
    try {
      const customers = paddle.customers.list({ email: [email] });
      for await (const customer of customers) {
        paddleCustomerId = customer.id;
        console.log(`📍 Found Paddle Customer ID: ${paddleCustomerId}`);
        break;
      }
    } catch (err) {
      console.warn('⚠️ Failed to search Paddle by email:', err);
    }
  }

  // 1. Cancel subscriptions in Paddle
  if (paddleCustomerId) {
    console.log(`📡 Fetching active subscriptions from Paddle for customer: ${paddleCustomerId}`);
    try {
      const subscriptions = paddle.subscriptions.list({
        customerId: [paddleCustomerId],
        status: ['active', 'trialing'],
      });

      let subCount = 0;
      for await (const sub of subscriptions) {
        subCount++;
        console.log(`🚫 Canceling Paddle subscription: ${sub.id}`);
        await paddle.subscriptions.cancel(sub.id, { effectiveFrom: 'immediately' });
        console.log(`✅ Canceled ${sub.id}`);
      }
      if (subCount === 0) console.log('✅ No active subscriptions found in Paddle.');
    } catch (err) {
      console.warn('⚠️ Subscription cleanup failed:', err);
    }
  } else {
    console.log('❌ Could not find this user in Paddle by ID or Email.');
  }
}

cleanup().finally(() => db.client.$disconnect());
