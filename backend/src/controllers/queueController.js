const prisma = require('../config/db');
const { getIO } = require('../config/socket');

/**
 * Helper to auto-cancel any active queues from previous days
 */
const cancelExpiredQueues = async () => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const expiredQueues = await prisma.queue.updateMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        created_at: { lt: todayStart }
      },
      data: {
        status: 'CANCELLED'
      }
    });
    
    if (expiredQueues.count > 0) {
      console.log(`[Auto-Clean] Cancelled ${expiredQueues.count} expired queues from previous days.`);
    }
  } catch (error) {
    console.error('[Auto-Clean Error] Failed to cancel expired queues:', error);
  }
};

/**
 * Recalculates / Updates the daily report for a stylist
 * Triggered in parallel (background) when a queue is COMPLETED
 */
const updateDailyReport = async (id_stylist, servicePrice) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Check if report already exists for this stylist on this day
    const existingReport = await prisma.report.findFirst({
      where: {
        id_stylist: id_stylist,
        period: today
      }
    });

    if (existingReport) {
      await prisma.report.update({
        where: { id_report: existingReport.id_report },
        data: {
          total_queue: { increment: 1 },
          total_revenue: { increment: servicePrice }
        }
      });
      console.log(`[Report Engine] Updated report for stylist ${id_stylist}: Total Queue +1, Revenue +${servicePrice}`);
    } else {
      await prisma.report.create({
        data: {
          period: today,
          total_queue: 1,
          total_revenue: servicePrice,
          id_stylist: id_stylist
        }
      });
      console.log(`[Report Engine] Created new report for stylist ${id_stylist} for date ${today.toDateString()}`);
    }
  } catch (error) {
    console.error(`[Report Engine Error] Failed to update report:`, error);
  }
};

/**
 * Task 2.3: Queue Booking Engine
 * Creates a new queue with explicit booking time and overlap validation
 */
const createQueue = async (req, res) => {
  try {
    const { id_service, id_stylist, customer_name, customer_phone, booking_time } = req.body;
    const id_user = req.user.id_user; // Decoded from auth middleware

    // Auto-cancel expired queues before processing new booking
    await cancelExpiredQueues();

    // Validate input
    if (!id_service || !id_stylist || !booking_time) {
      return res.status(400).json({ success: false, message: 'id_service, id_stylist, and booking_time are required.' });
    }

    // Verify Service exists and get est_duration
    const service = await prisma.service.findUnique({
      where: { id_service: parseInt(id_service, 10) }
    });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // Verify Stylist exists
    const stylist = await prisma.stylist.findUnique({
      where: { id_stylist: parseInt(id_stylist, 10) }
    });
    if (!stylist) {
      return res.status(404).json({ success: false, message: 'Stylist not found.' });
    }

    // Calculate booking end time based on service duration
    const start_time = new Date(booking_time);
    if (isNaN(start_time.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid booking_time format.' });
    }
    const end_time = new Date(start_time.getTime() + service.est_duration * 60000);

    // Overlap Check (Time Validation)
    const overlappingQueue = await prisma.queue.findFirst({
      where: {
        id_stylist: parseInt(id_stylist, 10),
        status: { in: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
        AND: [
          { booking_time: { lt: end_time } },
          { booking_end: { gt: start_time } }
        ]
      }
    });

    if (overlappingQueue) {
      return res.status(409).json({ 
        success: false, 
        message: '⚠️ Waktu tidak tersedia (Tabrakan jadwal). Barber sudah memiliki jadwal di rentang waktu ini.',
        overlap: overlappingQueue
      });
    }

    // Constraint 1: Unique Active Queue Constraint (1 CUSTOMER only has 1 active queue PENDING or IN_PROGRESS)
    const activeQueue = await prisma.queue.findFirst({
      where: {
        id_user: id_user,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    if (activeQueue) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active queue (PENDING or IN_PROGRESS). You cannot make multiple bookings.',
        active_queue: activeQueue
      });
    }

    // Constraint 2: Daily Auto-Increment Reset (reset queue number every day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const lastQueue = await prisma.queue.findFirst({
      where: {
        created_at: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: {
        queue_number: 'desc'
      }
    });
    const nextQueueNumber = lastQueue ? lastQueue.queue_number + 1 : 1;

    // Create Queue
    const newQueue = await prisma.queue.create({
      data: {
        id_user: id_user,
        id_service: parseInt(id_service, 10),
        id_stylist: parseInt(id_stylist, 10),
        queue_number: nextQueueNumber,
        status: 'PENDING',
        booking_time: start_time,
        booking_end: end_time,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null
      },
      include: {
        user: { select: { name: true, email: true } },
        service: true,
        stylist: true
      }
    });

    // Real-time notification: Emit NEW_QUEUE to Barber room & stylist room
    try {
      const io = getIO();
      io.to('barber').emit('NEW_QUEUE', newQueue);
      io.to(`stylist_${id_stylist}`).emit('NEW_QUEUE', newQueue);
      console.log(`[WebSocket] Emitted NEW_QUEUE event for queue #${newQueue.queue_number}`);
    } catch (wsError) {
      console.warn('[WebSocket Warning] Failed to emit WebSocket event:', wsError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Queue booked successfully.',
      data: newQueue
    });

  } catch (error) {
    console.error('Error booking queue:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

/**
 * Task 2.4: Real-time Barber Dashboard Engine
 * Update Queue Status (PENDING -> IN_PROGRESS -> COMPLETED)
 */
const updateQueueStatus = async (req, res) => {
  try {
    const { id_queue } = req.params;
    const { status } = req.body; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED

    if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing queue status.' });
    }

    // Get existing queue
    const queueIdInt = parseInt(id_queue, 10);
    const queue = await prisma.queue.findUnique({
      where: { id_queue: queueIdInt },
      include: { service: true }
    });

    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found.' });
    }

    // Update the queue status
    const updatedQueue = await prisma.queue.update({
      where: { id_queue: queueIdInt },
      data: { status: status },
      include: {
        user: { select: { name: true, email: true } },
        service: true,
        stylist: true
      }
    });

    // Emit Real-time status update to rooms
    try {
      const io = getIO();
      // Emit to general barber dashboard
      io.to('barber').emit('QUEUE_STATUS_UPDATED', updatedQueue);
      // Emit to stylist-specific room
      io.to(`stylist_${updatedQueue.id_stylist}`).emit('QUEUE_STATUS_UPDATED', updatedQueue);
      // Emit to individual customer room (if customer subscribed to queue_<id_queue>)
      io.to(`queue_${updatedQueue.id_queue}`).emit('QUEUE_STATUS_UPDATED', updatedQueue);
      console.log(`[WebSocket] Emitted QUEUE_STATUS_UPDATED to status: ${status} for queue #${updatedQueue.queue_number}`);
    } catch (wsError) {
      console.warn('[WebSocket Warning] Failed to emit WebSocket event:', wsError.message);
    }

    // Parallel Logic on COMPLETED status
    if (status === 'COMPLETED') {
      // Trigger daily report calculation in parallel (without awaiting to keep response times low)
      updateDailyReport(updatedQueue.id_stylist, updatedQueue.service.price)
        .catch(err => console.error('[Report Engine Parallel Error]', err));
    }

    return res.status(200).json({
      success: true,
      message: `Queue status updated to ${status} successfully.`,
      data: updatedQueue
    });

  } catch (error) {
    console.error('Error updating queue status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

/**
 * Gets active queues (for Barberoperational Dashboard sorting by priority and queue number)
 */
const getActiveQueues = async (req, res) => {
  try {
    // Auto-cancel expired queues before fetching active ones
    await cancelExpiredQueues();

    const { id_stylist } = req.query;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const filter = {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      created_at: {
        gte: todayStart,
        lte: todayEnd
      }
    };
    if (id_stylist) {
      filter.id_stylist = parseInt(id_stylist, 10);
    }

    // Sort by priority_level DESC, then queue_number ASC
    const activeQueues = await prisma.queue.findMany({
      where: filter,
      orderBy: [
        { queue_number: 'asc' }
      ],
      include: {
        user: { select: { name: true, email: true } },
        service: true,
        stylist: true
      }
    });

    return res.status(200).json({
      success: true,
      count: activeQueues.length,
      data: activeQueues
    });
  } catch (error) {
    console.error('Error fetching active queues:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

/**
 * Get compiled daily and stylist reports for the Owner
 * GET /api/queues/reports
 */
const getReports = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch today's queues
    const todayQueues = await prisma.queue.findMany({
      where: {
        created_at: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        service: true,
        stylist: true
      }
    });

    // Compute Daily Revenue (completed queues today)
    const completedQueues = todayQueues.filter(q => q.status === 'COMPLETED');
    const dailyRevenue = completedQueues.reduce((acc, q) => acc + q.service.price, 0);

    // Statistik Reservasi
    const totalReservations = todayQueues.length;
    const completedReservations = completedQueues.length;

    // Layanan Terlaris (Most Popular Service) & Tingkat Kepopuleran Layanan
    const serviceCounts = {};
    todayQueues.forEach(q => {
      const name = q.service.service_name;
      if (!serviceCounts[name]) {
        serviceCounts[name] = { name, count: 0, price: q.service.price };
      }
      serviceCounts[name].count += 1;
    });

    // Sort services by count descending
    const sortedServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count);
    const bestService = sortedServices.length > 0 ? sortedServices[0].name : "Belum ada layanan";

    // All registered stylists to show productivity
    const stylists = await prisma.stylist.findMany();
    
    // For productivity: ratio of completed vs total queues
    const stylistPerformance = stylists.map(stylist => {
      const stylistQueues = todayQueues.filter(q => q.id_stylist === stylist.id_stylist);
      const totalTasks = stylistQueues.length;
      const completedTasks = stylistQueues.filter(q => q.status === 'COMPLETED').length;
      const revenue = stylistQueues.filter(q => q.status === 'COMPLETED').reduce((acc, q) => acc + q.service.price, 0);
      
      return {
        id_stylist: stylist.id_stylist,
        name: stylist.name,
        specialty: stylist.specialty,
        status: stylist.status, // AVAILABLE / UNAVAILABLE
        totalTasks,
        completedTasks,
        revenue,
        ratioText: `${completedTasks}/${totalTasks}`,
        ratioVal: totalTasks > 0 ? (completedTasks / totalTasks) : 0
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        dailyRevenue,
        totalReservations,
        completedReservations,
        bestService,
        servicePopularity: sortedServices,
        stylistPerformance
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

/**
 * Gets all queues for today (active + completed + cancelled) for Barber/Owner management
 */
const getAllQueues = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const queues = await prisma.queue.findMany({
      where: {
        created_at: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { queue_number: 'asc' },
      include: {
        user: { select: { name: true, email: true } },
        service: true,
        stylist: true
      }
    });

    return res.status(200).json({
      success: true,
      count: queues.length,
      data: queues
    });
  } catch (error) {
    console.error('Error fetching all queues:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

/**
 * Gets the entire queue history for the logged-in customer
 */
const getUserQueueHistory = async (req, res) => {
  try {
    const id_user = req.user.id_user;

    const queues = await prisma.queue.findMany({
      where: {
        id_user: id_user
      },
      orderBy: { created_at: 'desc' },
      include: {
        service: true,
        stylist: true
      }
    });

    return res.status(200).json({
      success: true,
      count: queues.length,
      data: queues
    });
  } catch (error) {
    console.error('Error fetching user queue history:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

/**
 * Gets stats for the logged-in Barber (today stats + total customers served all time)
 */
const getBarberStats = async (req, res) => {
  try {
    const id_user = req.user.id_user;

    // Find the stylist record corresponding to this user ID
    const stylist = await prisma.stylist.findUnique({
      where: { id_user: id_user }
    });

    if (!stylist) {
      return res.status(404).json({ success: false, message: 'Barber record not found.' });
    }

    // 1. Total customers ever served (all-time COMPLETED queues for this stylist)
    const totalServed = await prisma.queue.count({
      where: {
        id_stylist: stylist.id_stylist,
        status: 'COMPLETED'
      }
    });

    // 2. Today's queues for stats counter
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayQueues = await prisma.queue.findMany({
      where: {
        created_at: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    const completed = todayQueues.filter(q => q.status === 'COMPLETED').length;
    const waiting = todayQueues.filter(q => q.status === 'PENDING').length;
    const inProgress = todayQueues.filter(q => q.status === 'IN_PROGRESS').length;
    const totalQueue = completed + waiting + inProgress;

    return res.status(200).json({
      success: true,
      data: {
        totalServed,
        todayStats: {
          totalQueue,
          completed,
          waiting,
          inProgress
        }
      }
    });

  } catch (error) {
    console.error('Error fetching barber stats:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

/**
 * Gets schedule/busy slots for a specific stylist on a given date
 */
const getStylistSchedule = async (req, res) => {
  try {
    const { id_stylist, date } = req.query;

    if (!id_stylist || !date) {
      return res.status(400).json({ success: false, message: 'id_stylist and date are required.' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const queues = await prisma.queue.findMany({
      where: {
        id_stylist: parseInt(id_stylist, 10),
        status: { in: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
        booking_time: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        booking_time: true,
        booking_end: true
      }
    });

    return res.status(200).json({
      success: true,
      data: queues
    });
  } catch (error) {
    console.error('Error fetching stylist schedule:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

module.exports = {
  createQueue,
  updateQueueStatus,
  getActiveQueues,
  getReports,
  getAllQueues,
  getUserQueueHistory,
  getBarberStats,
  getStylistSchedule
};
