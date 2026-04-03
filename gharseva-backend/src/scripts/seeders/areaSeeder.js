const ServiceableArea = require('../../models/ServiceableArea');

const seedAreas = async () => {
  try {
    // Clear existing areas to avoid duplicates if needed, 
    // or just check if they exist. For now, let's just create.
    const count = await ServiceableArea.countDocuments();
    if (count > 0) {
      console.log('Serviceable areas already seeded.');
      return;
    }

    const area = await ServiceableArea.create({
      cityName: "Kolkata (New Town)",
      pincodes: ["700156", "700135", "700157"],
      isActive: true
    });

    console.log("Serviceable Area Seeded:", area.cityName);
  } catch (error) {
    console.error('Error seeding areas:', error);
    throw error;
  }
};

module.exports = seedAreas;
