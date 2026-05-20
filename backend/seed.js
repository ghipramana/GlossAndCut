const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing services, reports, and queues...');
  await prisma.report.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.stylist.deleteMany({});
  await prisma.service.deleteMany({});
  
  console.log('Seeding the 6 default services...');
  const services = [
    { service_name: "Potong Rambut Pria", price: 50000, est_duration: 30 },
    { service_name: "Potong Rambut Wanita", price: 75000, est_duration: 45 },
    { service_name: "Cuci + Potong", price: 65000, est_duration: 40 },
    { service_name: "Pewarnaan Rambut", price: 150000, est_duration: 90 },
    { service_name: "Smoothing Premium", price: 300000, est_duration: 120 },
    { service_name: "Cukur Jenggot", price: 25000, est_duration: 15 }
  ];

  for (const svc of services) {
    await prisma.service.create({
      data: svc
    });
  }

  // Find all existing users with role 'BARBER' and recreate their stylist entries if missing
  const barberUsers = await prisma.user.findMany({
    where: { role: 'BARBER' }
  });

  for (const barber of barberUsers) {
    await prisma.stylist.create({
      data: {
        id_user: barber.id_user,
        name: barber.name,
        specialty: 'General Stylist',
        status: 'AVAILABLE'
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
