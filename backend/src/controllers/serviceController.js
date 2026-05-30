const prisma = require('../config/db');

// Get all services
const getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { id_service: 'asc' }
    });
    return res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error('Get services error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve services.' });
  }
};

// Create service (Owner only)
const createService = async (req, res) => {
  try {
    const { service_name, price, est_duration } = req.body;

    if (!service_name || !price || !est_duration) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (parseFloat(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be greater than 0.' });
    }

    const newService = await prisma.service.create({
      data: {
        service_name,
        price: parseFloat(price),
        est_duration: parseInt(est_duration, 10)
      }
    });

    return res.status(201).json({ success: true, message: 'Service created successfully.', data: newService });
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create service.' });
  }
};

// Update service (Owner only)
const updateService = async (req, res) => {
  try {
    const { id_service } = req.params;
    const { service_name, price, est_duration } = req.body;

    const serviceId = parseInt(id_service, 10);
    const existing = await prisma.service.findUnique({ where: { id_service: serviceId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const updateData = {};
    if (service_name) updateData.service_name = service_name;
    if (price !== undefined) {
      if (parseFloat(price) <= 0) {
        return res.status(400).json({ success: false, message: 'Price must be greater than 0.' });
      }
      updateData.price = parseFloat(price);
    }
    if (est_duration !== undefined) updateData.est_duration = parseInt(est_duration, 10);

    const updated = await prisma.service.update({
      where: { id_service: serviceId },
      data: updateData
    });

    return res.status(200).json({ success: true, message: 'Service updated successfully.', data: updated });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update service.' });
  }
};

// Delete service (Owner only)
const deleteService = async (req, res) => {
  try {
    const { id_service } = req.params;
    const serviceId = parseInt(id_service, 10);

    const existing = await prisma.service.findUnique({ where: { id_service: serviceId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // Check if service is being used/has been used in any queue
    const queueUsingService = await prisma.queue.findFirst({
      where: { id_service: serviceId }
    });

    if (queueUsingService) {
      return res.status(400).json({
        success: false,
        message: 'Layanan tidak dapat dihapus karena sedang atau pernah digunakan dalam antrean/booking pelanggan.'
      });
    }

    await prisma.service.delete({ where: { id_service: serviceId } });
    return res.status(200).json({ success: true, message: 'Service deleted successfully.' });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete service.' });
  }
};

module.exports = {
  getAllServices,
  createService,
  updateService,
  deleteService
};
