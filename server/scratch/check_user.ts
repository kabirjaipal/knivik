
import { db } from '../src/lib/db.js';

async function main() {
  const users = await db.client.user.findMany({
    where: { email: 'kabir@knivik.com' },
    select: { id: true, email: true, role: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => db.client.$disconnect());
