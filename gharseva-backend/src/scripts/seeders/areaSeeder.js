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
        pincodes: [
          { pincode: "700156", name: "New Town" },
          { pincode: "700135", name: "Action Area 1" },
          { pincode: "700157", name: "Action Area 2" },
          { pincode: "700091", name: "Salt Lake Sector V" },
          { pincode: "700102", name: "Rajarhat" }
        ],
        isActive: true
      },
      {
        cityName: "Bidhannagar",
        pincodes: [
          { pincode: "700064", name: "Salt Lake Sector I" },
          { pincode: "700097", name: "Salt Lake Sector II" },
          { pincode: "700098", name: "Salt Lake Sector III" }
        ],
        isActive: true
      }
    ];

    for (const areaData of areas) {
      await ServiceableArea.findOneAndUpdate(
        { cityName: areaData.cityName },
        areaData,
        { upsert: true, new: true }
      );
      console.log("Serviceable Area Seeded:", areaData.cityName);
    }
  } catch (error) {
    console.error('Error seeding areas:', error);
    throw error;
  }
};

module.exports = seedAreas;
