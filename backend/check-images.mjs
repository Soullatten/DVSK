import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const p = new PrismaClient();

// Get the most recent few orders with items
const orders = await p.order.findMany({
  orderBy: { createdAt: 'desc' },
  take: 3,
  include: { items: true }
});

console.log('\n── Recent orders + their item images ──\n');
for (const o of orders) {
  console.log(`Order #${o.orderNumber}  (${o.items.length} items)`);
  for (const it of o.items) {
    console.log(`  • ${it.productName}`);
    console.log(`    image field: ${JSON.stringify(it.image)}`);

    if (it.image) {
      // Try to find this file on disk
      const candidates = [
        path.resolve(process.cwd(), it.image.replace(/^\//, '')),
        path.resolve(process.cwd(), 'uploads', path.basename(it.image)),
        path.resolve(process.cwd(), '..', 'src', 'assets', path.basename(it.image)),
      ];
      let found = null;
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          const sz = fs.statSync(c).size;
          found = `${c} (${sz} bytes)`;
          break;
        }
      }
      console.log(`    on disk: ${found || '❌ NOT FOUND in any candidate path'}`);
    }
  }
  console.log();
}

// Also check what's in the uploads folder
console.log('── Files currently in backend/uploads/ ──');
try {
  const files = fs.readdirSync(path.resolve(process.cwd(), 'uploads'));
  console.log(files.slice(0, 20).join('\n') || '(empty)');
} catch (e) {
  console.log('uploads/ directory not found or empty');
}

await p.$disconnect();
