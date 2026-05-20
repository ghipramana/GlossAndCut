const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing prisma connection and queue fields...');
  try {
    const queue = await prisma.queue.findFirst({
      include: {
        user: true,
        service: true,
        stylist: true
      }
    });
    console.log('Successfully queried database! Found first queue item:');
    console.log(JSON.stringify(queue, null, 2));
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
