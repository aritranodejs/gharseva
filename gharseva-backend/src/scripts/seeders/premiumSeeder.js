const Package = require('../../models/Package');
const Service = require('../../models/Service');

const seedPremium = async () => {
  try {
    const pkgExists = await Package.findOne({ name: "VIP Elite Household" });
    if (pkgExists) {
      console.log('Premium VIP package already seeded.');
      return;
    }

    const pkg = await Package.create({
      name: "VIP Elite Household",
      description: "The ultimate luxury home management plan. Includes dedicated executive pros, priority scheduling, and premium cleaning supplies.",
      icon: "💎",
      isPremium: true,
      perks: [
        "Executive Top-Rated Professionals Only",
        "VIP Priority 24/7 Support",
        "Complimentary Premium Bio-degradable Supplies",
        "Priority Same-Day Emergency Visits"
      ],
      perVisitPrice: 899,
      subscriptionTiers: [
        { label: "2x / week (Lite VIP)", frequency: 2, monthlyPrice: 5999 },
        { label: "4x / week (Elite VIP)", frequency: 4, monthlyPrice: 10999 },
        { label: "Daily (Imperial VIP)", frequency: 7, monthlyPrice: 18999 }
      ]
    });

    console.log("Premium Package Seeded:", pkg.name);

    // Update individual services with premium/luxury flags
    await Service.updateMany(
      { name: { $regex: /Cleaning/i } },
      { $set: { isPremium: true } }
    );

    await Service.updateMany(
      { name: { $regex: /Full Home/i } },
      { $set: { isLuxury: true } }
    );
    console.log("Service premium/luxury flags updated.");
  } catch (error) {
    console.error('Error seeding premium package:', error);
    throw error;
  }
};

module.exports = seedPremium;
