const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT column_name, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users' AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
