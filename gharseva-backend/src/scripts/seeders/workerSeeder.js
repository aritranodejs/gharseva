const Worker = require('../../models/Worker');
const Category = require('../../models/Category');

const seedWorkers = async () => {
  await Worker.deleteMany({});
  
  // Fetch categories to link by ID
  const categories = await Category.find({});
  const getCatId = (slug) => categories.find(c => c.slug === slug)?._id;

  await Worker.create([
    {
      name: 'Ramesh Kumar',
      phoneNumber: '9999999999',
      password: 'Ramesh',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      pincodes: ['700156', '700091'],
      skills: ['electrician', 'plumbing'],
      categories: [getCatId('electrician'), getCatId('plumbing')].filter(Boolean),
      activeBookingsCount: 0,
      rating: 4.8,
      isTrustVerified: true,
      isOnline: true,
      status: 'approved',
      profilePicture: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400'
    },
    {
      name: 'Suresh Das',
      phoneNumber: '9876543211',
      password: 'Suresh',
      location: { type: 'Point', coordinates: [77.6000, 12.9800] },
      pincodes: ['700156', '700135'],
      skills: ['cleaning'],
      categories: [getCatId('cleaning')].filter(Boolean),
      activeBookingsCount: 0,
      rating: 4.9,
      isTrustVerified: true,
      isOnline: true,
      status: 'approved',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    },
    {
      name: 'Anita Roy',
      phoneNumber: '9876543212',
      password: 'Anita',
      location: { type: 'Point', coordinates: [77.6100, 12.9900] },
      pincodes: ['700091', '700135'],
      skills: ['care', 'cook'],
      categories: [getCatId('care'), getCatId('cook')].filter(Boolean),
      activeBookingsCount: 0,
      rating: 4.7,
      isTrustVerified: true,
      isOnline: true,
      status: 'approved',
      profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
    }
  ]);
};

module.exports = seedWorkers;
