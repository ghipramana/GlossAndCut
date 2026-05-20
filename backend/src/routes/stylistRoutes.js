const express = require('express');
const router = express.Router();
const stylistController = require('../controllers/stylistController');
const authMiddleware = require('../middleware/auth');

// All authenticated users can see stylists
router.get('/', authMiddleware(['CUSTOMER', 'BARBER', 'OWNER']), stylistController.getAllStylists);

// Barber or Owner can update status
router.patch('/:id_stylist/status', authMiddleware(['BARBER', 'OWNER']), stylistController.updateStylistStatus);
router.patch('/:id_stylist', authMiddleware(['BARBER', 'OWNER']), stylistController.updateStylistStatus);

module.exports = router;
