
import { db } from '../src/lib/db.js';

async function main() {
  const user = await db.client.user.findUnique({
    where: { email: 'kabir@knivik.xyz' },
    select: { 
      id: true, 
      email: true, 
      role: true, 
      plan: true, 
      subscriptionStatus: true,
      _count: {
        select: { products: true }
      }
    }
  });
  console.log(JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => db.client.$disconnect());
