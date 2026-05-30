const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/auth');

// Public/All authenticated users
router.get('/', authMiddleware(['CUSTOMER', 'BARBER', 'OWNER']), serviceController.getAllServices);

// Owner only routes
router.post('/', authMiddleware(['OWNER']), serviceController.createService);
router.put('/:id_service', authMiddleware(['OWNER']), serviceController.updateService);
router.delete('/:id_service', authMiddleware(['OWNER']), serviceController.deleteService);

module.exports = router;
