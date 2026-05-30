const prisma = require('../config/db');

// Get all stylists
const getAllStylists = async (req, res) => {
  try {
    const stylists = await prisma.stylist.findMany({
      orderBy: { id_stylist: 'asc' }
    });
    return res.status(200).json({ success: true, data: stylists });
  } catch (error) {
    console.error('Get stylists error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve stylists.' });
  }
};

// Update status (Barber/Owner only)
const updateStylistStatus = async (req, res) => {
  try {
    const { id_stylist } = req.params;
    const { status } = req.body; // AVAILABLE, UNAVAILABLE

    let normalizedStatus = status;
    if (typeof status === 'string') {
      const upper = status.toUpperCase();
      if (upper === 'AVAILABLE') {
        normalizedStatus = 'AVAILABLE';
      } else if (upper === 'UNAVAILABLE' || upper === 'BUSY') {
        normalizedStatus = 'UNAVAILABLE';
      }
    }

    if (!normalizedStatus || !['AVAILABLE', 'UNAVAILABLE'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Choose AVAILABLE or UNAVAILABLE.' });
    }

    const stylistId = parseInt(id_stylist, 10);
    const existing = await prisma.stylist.findUnique({ where: { id_stylist: stylistId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Stylist not found.' });
    }

    const updated = await prisma.stylist.update({
      where: { id_stylist: stylistId },
      data: { status: normalizedStatus }
    });

    return res.status(200).json({ success: true, message: 'Stylist status updated successfully.', data: updated });
  } catch (error) {
    console.error('Update stylist status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update stylist status.' });
  }
};

// Update stylist photo
const updateStylistPhoto = async (req, res) => {
  try {
    const { id_stylist } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    const stylistId = parseInt(id_stylist, 10);
    const existing = await prisma.stylist.findUnique({ where: { id_stylist: stylistId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Stylist not found.' });
    }

    const photoUrl = req.file.path;

    const updated = await prisma.stylist.update({
      where: { id_stylist: stylistId },
      data: { photoUrl }
    });

    return res.status(200).json({ success: true, message: 'Photo uploaded successfully', data: updated });
  } catch (error) {
    console.error('Upload photo error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload photo.' });
  }
};

module.exports = {
  getAllStylists,
  updateStylistStatus,
  updateStylistPhoto
};
