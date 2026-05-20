const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const authMiddleware = require('../middleware/auth');

// GET /api/queues - Get all queues for today (Barber/Owner only)
router.get('/', authMiddleware(['BARBER', 'OWNER']), queueController.getAllQueues);

// POST /api/queues - Book a queue (Customer only)
router.post('/', authMiddleware(['CUSTOMER']), queueController.createQueue);

// PATCH /api/queues/:id_queue/status - Update queue status (Barber or Owner/Admin only)
router.patch('/:id_queue/status', authMiddleware(['BARBER', 'OWNER']), queueController.updateQueueStatus);

// GET /api/queues/active - Get active queues sorted by priority and number (All roles, but mostly Barber Dashboard)
router.get('/active', authMiddleware(['BARBER', 'OWNER', 'CUSTOMER']), queueController.getActiveQueues);

// GET /api/queues/history - Get queue history of the logged-in customer (Customer only)
router.get('/history', authMiddleware(['CUSTOMER']), queueController.getUserQueueHistory);

// GET /api/queues/barber-stats - Get stats for the logged-in Barber (Barber only)
router.get('/barber-stats', authMiddleware(['BARBER']), queueController.getBarberStats);

// GET /api/queues/reports - Get daily owner report aggregated stats (Owner only)
router.get('/reports', authMiddleware(['OWNER']), queueController.getReports);

// GET /api/queues/schedule - Get stylist schedule for overlap check (Customer only)
router.get('/schedule', authMiddleware(['CUSTOMER']), queueController.getStylistSchedule);

module.exports = router;
