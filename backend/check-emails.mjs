import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const logs = await p.emailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 15 });
console.log('Last 15 email sends:');
console.log('─'.repeat(90));
for (const l of logs) {
  console.log(`[${l.status.padEnd(7)}] ${l.createdAt.toISOString().slice(0,19)}  → ${l.toEmail}`);
  console.log(`         Template: ${l.templateKey}  |  Subject: ${l.subject.slice(0,60)}`);
  console.log(`         Mocked: ${l.wasMocked}  Redirect: ${l.wasTestRedirect}  Trigger: ${l.triggeredBy || '-'}`);
  if (l.errorMessage) console.log(`         ❌ ERROR: ${l.errorMessage}`);
  console.log();
}
await p.$disconnect();
