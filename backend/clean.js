const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();
prisma.queue.deleteMany({})
  .then(() => console.log('Deleted all queues'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
