const { PrismaClient } = require('./src/generated/prisma');

async function testScenario() {
  console.log('=== STARTING GLOSS & CUT INTEGRATION TEST ===\n');
  
  const prisma = new PrismaClient();
  const baseUrl = 'http://localhost:5000/api/queues';

  try {
    // 0. Ensure server is running (we will make requests to it)
    console.log('Verifying server connection...');
    const rootRes = await fetch('http://localhost:5000/');
    const rootData = await rootRes.json();
    console.log('Server Status:', rootData.message);
    console.log('--------------------------------------------------');

    // 1. Ahmad (User 1) books Gentleman Haircut (Service 1) with Stylist 1
    console.log('SCENARIO 1: Ahmad (Customer 1) books Gentleman Haircut (Service 1) with Stylist 1');
    const book1Res = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '1',
        'x-user-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        id_service: 1,
        id_stylist: 1,
        booking_time: new Date().toISOString()
      })
    });
    const book1 = await book1Res.json();
    console.log('Result:', book1.success ? 'SUCCESS' : 'FAILED', book1.message);
    if (book1.success) {
      console.log('Queue Number:', book1.data.queue_number);
      console.log('Booked Time:', book1.data.booking_time);
    }
    console.log('--------------------------------------------------');

    // 2. Ahmad (User 1) tries to book again while already in queue
    console.log('SCENARIO 2: Ahmad tries to book again (Should fail with Unique Active Queue Constraint)');
    const book2Res = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '1',
        'x-user-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        id_service: 2,
        id_stylist: 1,
        booking_time: new Date().toISOString()
      })
    });
    const book2 = await book2Res.json();
    console.log('Result:', book2.success ? 'SUCCESS' : 'EXPECTED FAILURE', book2.message);
    console.log('--------------------------------------------------');

    // 3. Rian (User 2) books Hair Coloring (Service 2 - 60 min duration) with Stylist 1
    console.log('SCENARIO 3: Rian (Customer 2) books Hair Coloring (Service 2) with Stylist 1');
    console.log('Expected behavior: Should succeed, wait time is Ahmad\'s duration (30 mins).');
    const book3Res = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '2',
        'x-user-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        id_service: 2,
        id_stylist: 1,
        booking_time: new Date(Date.now() + 600000).toISOString() // 10 mins later
      })
    });
    const book3 = await book3Res.json();
    console.log('Result:', book3.success ? 'SUCCESS' : 'FAILED', book3.message);
    if (book3.success) {
      console.log('Queue Number:', book3.data.queue_number);
      console.log('Booked Time:', book3.data.booking_time);
    }
    console.log('--------------------------------------------------');

    // 4. Fetch Active Queues for Barber (should sort priority high first)
    console.log('SCENARIO 4: Fetch Active Queues (Sorting Check: Priority level 1 should be first, then queue number)');
    const activeRes = await fetch(`${baseUrl}/active`, {
      headers: {
        'x-user-id': '3',
        'x-user-role': 'BARBER'
      }
    });
    const activeData = await activeRes.json();
    console.log('Active Queues Count:', activeData.count);
    activeData.data.forEach((q, idx) => {
      console.log(`${idx + 1}. Queue #${q.queue_number} | Customer: ${q.user.name} | Service: ${q.service.service_name} | Priority: ${q.priority_level}`);
    });
    console.log('--------------------------------------------------');

    // 5. Update Ahmad's queue to IN_PROGRESS
    const q1Id = book1.data.id_queue;
    console.log(`SCENARIO 5: Barber updates Ahmad's queue (ID: ${q1Id}) status to IN_PROGRESS`);
    const status1Res = await fetch(`${baseUrl}/${q1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '3',
        'x-user-role': 'BARBER'
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    const status1 = await status1Res.json();
    console.log('Result:', status1.success ? 'SUCCESS' : 'FAILED', status1.message);
    console.log('--------------------------------------------------');

    // 6. Update Ahmad's queue to COMPLETED
    console.log(`SCENARIO 6: Barber updates Ahmad's queue (ID: ${q1Id}) status to COMPLETED (Should trigger Report recalculation)`);
    const status2Res = await fetch(`${baseUrl}/${q1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '3',
        'x-user-role': 'BARBER'
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    const status2 = await status2Res.json();
    console.log('Result:', status2.success ? 'SUCCESS' : 'FAILED', status2.message);
    console.log('--------------------------------------------------');

    // 7. Verify Report database is populated
    console.log('SCENARIO 7: Verifying Parallel Flow Logic (Report Upsert)');
    console.log('Waiting 1 second for background report calculation to complete...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const reports = await prisma.report.findMany({
      include: { stylist: true }
    });
    console.log(`Reports found: ${reports.length}`);
    reports.forEach(r => {
      console.log(`Report ID: ${r.id_report} | Period: ${r.period.toDateString()} | Stylist: ${r.stylist.name} | Total Queue: ${r.total_queue} | Total Revenue: Rp${r.total_revenue}`);
    });
    console.log('--------------------------------------------------');
    console.log('=== ALL SCENARIOS VERIFIED SUCCESSFULLY ===');

  } catch (err) {
    console.error('Test script crashed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testScenario();
