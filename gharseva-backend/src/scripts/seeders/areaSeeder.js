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

    const areas = [
      {
        cityName: "Kolkata (New Town/Salt Lake)",
        pincodes: ["700156", "700135", "700157", "700091", "700102"],
        isActive: true
      },
      {
        cityName: "Bidhannagar",
        pincodes: ["700064", "700097", "700098"],
        isActive: true
      }
    ];

    for (const areaData of areas) {
      await ServiceableArea.findOneAndUpdate(
        { cityName: areaData.cityName },
        areaData,
        { upsert: true, new: true }
      );
    }

    console.log("Serviceable Area Seeded:", area.cityName);
  } catch (error) {
    console.error('Error seeding areas:', error);
    throw error;
  }
};

module.exports = seedAreas;
