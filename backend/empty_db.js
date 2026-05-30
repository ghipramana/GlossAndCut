const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  console.log("=== EMPTYING DATABASE TABLES ===");
  try {
    // Delete in correct order to satisfy foreign key constraints
    console.log("Deleting reports...");
    await prisma.report.deleteMany({});
    
    console.log("Deleting queues...");
    await prisma.queue.deleteMany({});
    
    console.log("Deleting stylists...");
    await prisma.stylist.deleteMany({});
    
    console.log("Deleting services...");
    await prisma.service.deleteMany({});
    
    console.log("Deleting users...");
    await prisma.user.deleteMany({});
    
    console.log("SUCCESS: All database tables are now empty!");
  } catch (error) {
    console.error("ERROR emptying database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
