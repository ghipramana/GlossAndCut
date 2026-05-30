const prisma = require('../config/db');

/**
 * Get operational settings
 * If settings don't exist, seed default values.
 */
const getSettings = async (req, res) => {
  try {
    let settings = await prisma.setting.findMany();
    
    // Seed default if empty
    if (settings.length === 0) {
      await prisma.setting.createMany({
        data: [
          { key: 'operational_start', value: '08:00' },
          { key: 'operational_end', value: '22:00' }
        ]
      });
      settings = await prisma.setting.findMany();
    }
    
    const settingsObject = {};
    settings.forEach(s => {
      settingsObject[s.key] = s.value;
    });

    return res.status(200).json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

/**
 * Update operational settings
 */
const updateSettings = async (req, res) => {
  try {
    const { operational_start, operational_end } = req.body;
    
    // UPSERT operational_start
    if (operational_start) {
      await prisma.setting.upsert({
        where: { key: 'operational_start' },
        update: { value: operational_start },
        create: { key: 'operational_start', value: operational_start }
      });
    }

    // UPSERT operational_end
    if (operational_end) {
      await prisma.setting.upsert({
        where: { key: 'operational_end' },
        update: { value: operational_end },
        create: { key: 'operational_end', value: operational_end }
      });
    }

    const newSettings = await prisma.setting.findMany();
    const settingsObject = {};
    newSettings.forEach(s => {
      settingsObject[s.key] = s.value;
    });

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settingsObject
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
