import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const log = await p.emailLog.findFirst({ orderBy: { createdAt: 'desc' } });
if (!log) { console.log('no log'); process.exit(0); }
const v = log.variables || {};
console.log('Latest send →', log.toEmail, '|', log.status, '|', log.createdAt.toISOString());
console.log('Template:', log.templateKey);
console.log();
console.log('heroImageUrl prefix:', String(v.heroImageUrl || '').slice(0, 100));
console.log('heroImageUrl length:', String(v.heroImageUrl || '').length);
console.log();
if (Array.isArray(v.products)) {
  console.log('Products:');
  v.products.forEach((p, i) => {
    console.log(`  [${i}] ${p.name}`);
    console.log(`      imageUrl prefix: ${String(p.imageUrl || '').slice(0, 80)}`);
    console.log(`      imageUrl length: ${String(p.imageUrl || '').length}`);
  });
}
if (Array.isArray(v.items)) {
  console.log('\nItems:');
  v.items.forEach((it, i) => {
    console.log(`  [${i}] ${it.name}`);
    console.log(`      imageUrl prefix: ${String(it.imageUrl || '').slice(0, 80)}`);
    console.log(`      imageUrl length: ${String(it.imageUrl || '').length}`);
  });
}
await p.$disconnect();
