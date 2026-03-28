const Package = require('../../models/Package');

const seedPackages = async (services) => {
  await Package.deleteMany({});
  
  // 1. Wash & Cleaning (Home + Dishes)
  await Package.create({
    name: 'Wash & Cleaning',
    description: 'Professional home cleaning plus a sparkling kitchen. Perfect for a fresh start every week.',
    services: services.filter(s => ['Home Cleaning', 'Dishwashing'].includes(s.name)).map(s => s._id),
    icon: '🧼',
    perVisitPrice: 599,
    subscriptionTiers: [
      { label: 'Weekly', frequency: 1, monthlyPrice: 2199 },
      { label: 'Bi-Weekly', frequency: 2, monthlyPrice: 3999 }
    ]
  });

  // 2. Laundry Pro (Clothes + Ironing)
  await Package.create({
    name: 'Laundry Pro',
    description: 'Never worry about laundry again. Professional washing and premium steam ironing delivered to your door.',
    services: services.filter(s => ['Clothes Washing', 'Steam Ironing'].includes(s.name)).map(s => s._id),
    icon: '👔',
    perVisitPrice: 349,
    subscriptionTiers: [
      { label: '2x / Week', frequency: 2, monthlyPrice: 2499 },
      { label: 'Daily', frequency: 7, monthlyPrice: 7999 }
    ]
  });

  // 3. Mega Household Package (Everything)
  await Package.create({
    name: 'Mega Household',
    description: 'The ultimate convenience. Home cleaning, dishes, laundry, and primary care support all in one subscription.',
    services: services.filter(s => ['Home Cleaning', 'Dishwashing', 'Clothes Washing', 'Home Cook'].includes(s.name)).map(s => s._id),
    icon: '🏰',
    perVisitPrice: 999,
    subscriptionTiers: [
      { label: 'Daily Pro', frequency: 7, monthlyPrice: 19999 },
      { label: 'Weekend Lite', frequency: 2, monthlyPrice: 5999 }
    ]
  });
};

module.exports = seedPackages;
