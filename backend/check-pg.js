const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT version()
  `;
  console.log('PostgreSQL version:', JSON.stringify(result, null, 2));

  const hasGenRandom = await prisma.$queryRaw`
    SELECT proname FROM pg_proc WHERE proname = 'gen_random_uuid'
  `;
  console.log('Has gen_random_uuid:', JSON.stringify(hasGenRandom, null, 2));

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
