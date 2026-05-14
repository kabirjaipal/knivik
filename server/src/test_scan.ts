import 'dotenv/config';
import { db } from './lib/db.js';
import { BatchProcessingService } from './services/batchProcessingService.js';

async function main() {
  console.log('Fetching active products from database...');
  const products = await db.client.product.findMany({
    where: { isActive: true },
  });

  console.log(`Found ${products.length} active products.`);

  if (products.length === 0) {
    console.log('No active products found in DB. Seeding a sample product for testing...');
    // Seed a user if none exists
    let user = await db.client.user.findFirst();
    if (!user) {
      user = await db.client.user.create({
        data: {
          email: 'test@knivik.ai',
          username: 'testuser',
          password: 'dummy',
          plan: 'PRO'
        }
      });
    }

    const newProduct = await db.client.product.create({
      data: {
        userId: user.id,
        name: 'Supabase',
        description: 'Open source Firebase alternative providing Postgres database, authentication, instant APIs, edge functions, and real-time subscriptions. Also a good alternative to PlanetScale and Render.',
      }
    });
    console.log(`Created sample product: ${newProduct.name} (${newProduct.id})`);
    products.push(newProduct);
  }

  const targetProduct = products[0];
  console.log(`\n========================================`);
  console.log(`🚀 RUNNING LIVE PROD-LEVEL PIPELINE TEST`);
  console.log(`Target Product: "${targetProduct.name}" (ID: ${targetProduct.id})`);
  console.log(`Description: ${targetProduct.description}`);
  console.log(`========================================\n`);

  const result = await BatchProcessingService.processProduct(targetProduct.id);

  console.log(`\n========================================`);
  console.log(`📈 TEST PIPELINE EXECUTION RESULTS`);
  console.log(JSON.stringify(result, null, 2));
  console.log(`========================================\n`);

  process.exit(0);
}

main().catch(console.error);
