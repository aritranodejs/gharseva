const Service = require('../../models/Service');

const seedServices = async () => {
  await Service.deleteMany({});
  const services = await Service.create([
    { 
      name: 'Home Cleaning', 
      categoryId: 'cleaning', 
      basePrice: 499, 
      duration: '2 hrs', 
      icon: '🧹',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60',
      description: 'Professional deep cleaning for your entire home.',
      included: ['Dusting all surfaces', 'Mopping floors', 'Bathroom sanitization', 'Kitchen cleaning'],
      availablePincodes: ['700156', '700091', '700135'],
      checklist: ['Dusting all rooms', 'Mopping floors', 'Bathroom/Toilet cleaning', 'Kitchen slab cleaning', 'Trash removal'],
      rating: 4.9,
      reviewsCount: 312
    },
    { 
      name: 'Dishwashing', 
      categoryId: 'cleaning', 
      basePrice: 199, 
      duration: '1 hr', 
      icon: '🍽️',
      image: 'https://images.unsplash.com/photo-1585093710594-e35fe8ba2066?w=500&auto=format&fit=crop&q=60',
      description: 'Get your dishes sparkling clean without the hassle.',
      included: ['Scrubbing and washing', 'Drying and stacking', 'Sink area cleaning'],
      availablePincodes: ['700156', '700091'],
      checklist: ['Washing all utensils', 'Drying utensils', 'Cleaning sink area', 'Kitchen counter wipe'],
      rating: 4.7,
      reviewsCount: 178
    },
    { 
      name: 'Clothes Washing', 
      categoryId: 'cleaning', 
      basePrice: 249, 
      duration: '1.5 hrs', 
      icon: '👕',
      image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&auto=format&fit=crop&q=60',
      description: 'Expert laundry service at your doorstep.',
      included: ['Washing and rinsing', 'Drying', 'Folded or hung as per request'],
      availablePincodes: ['700156', '400001'],
      checklist: ['Separating whites/colors', 'Machine/Hand wash', 'Drying', 'Folding'],
      rating: 4.8,
      reviewsCount: 225
    },
    { 
      name: 'Steam Ironing', 
      categoryId: 'cleaning', 
      basePrice: 149, 
      duration: '1 hr', 
      icon: '💨',
      image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=500&auto=format&fit=crop&q=60',
      description: 'Professional steam ironing for crisp, wrinkle-free clothes.',
      included: ['Steam pressing', 'Hanger service', 'Minor lint removal'],
      availablePincodes: ['700156', '700091'],
      checklist: ['Temperature check', 'Steam press', 'Collar/Cuff detailing', 'Hanging/Folding'],
      rating: 4.9,
      reviewsCount: 95
    },
    { 
      name: 'Child Care (Babysitter)', 
      categoryId: 'care', 
      basePrice: 599, 
      duration: '4 hrs', 
      icon: '👶',
      image: 'https://images.unsplash.com/photo-1544640808-32cb5eff4380?w=500&auto=format&fit=crop&q=60',
      description: 'Experienced and caring babysitters.',
      included: ['Feeding and care', 'Playtime and engaging activities'],
      availablePincodes: ['700156', '700091'],
      checklist: ['Aadhaar Verified', 'Police Verification Done', 'Basic Medical Emergency Training'],
      rating: 4.9,
      reviewsCount: 142,
      isTrustService: true
    },
    { 
      name: 'Home Cook', 
      categoryId: 'cook', 
      basePrice: 399, 
      duration: '1 hr', 
      icon: '🧑‍🍳',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&auto=format&fit=crop&q=60',
      description: 'Delicious, hygienic home-cooked meals by verified culinary experts.',
      included: ['Meal preparation', 'Kitchen cleanup'],
      availablePincodes: ['700156', '700135'],
      checklist: ['Aadhaar Verified', 'Health & Hygiene Check Passed', 'Police Verification Done'],
      rating: 4.8,
      reviewsCount: 201,
      isTrustService: true
    },
    { 
      name: 'Elder Care', 
      categoryId: 'care', 
      basePrice: 699, 
      duration: '8 hrs', 
      icon: '👴',
      image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=500&auto=format&fit=crop&q=60',
      description: 'Compassionate care for the elderly.',
      included: ['Medication reminders', 'Mobility support'],
      availablePincodes: ['700156', '700091', '700135'],
      checklist: ['Aadhaar Verified', 'Police Verification Done', 'Medical Care Training'],
      rating: 4.9,
      reviewsCount: 88,
      isTrustService: true
    },
    { 
      name: 'Electrician (Visit)', 
      categoryId: 'electrician', 
      priceType: 'visit',
      basePrice: 199, 
      duration: '1 hr', 
      icon: '🔌',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60',
      description: 'Certified electricians to fix any electrical issue safely.',
      included: ['1 Hour Diagnosis & Basic Repair', 'Safety check post-repair'],
      availablePincodes: ['700156', '700091', '700135'],
      checklist: ['Certified Professional', 'Tool Kit Included', 'Safety Gear Worn'],
      rating: 4.6,
      reviewsCount: 310,
      isSkilledService: true
    },
    { 
      name: 'Plumbing (Visit)', 
      categoryId: 'plumbing', 
      priceType: 'visit',
      basePrice: 149, 
      duration: '1 hr', 
      icon: '🚰',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60',
      description: 'Resolve leaks, clogs, and pipe issues fast.',
      included: ['Leak detection', 'Minor pipe/tap repair'],
      availablePincodes: ['700156'],
      checklist: ['Certified Professional', 'Plumbing Kit Included'],
      rating: 4.7,
      reviewsCount: 156,
      isSkilledService: true
    },
    { 
      name: 'AC Service & Repair', 
      categoryId: 'ac', 
      priceType: 'fixed',
      basePrice: 499, 
      duration: '2 hrs', 
      icon: '❄️',
      image: 'https://images.unsplash.com/photo-1620601550785-5df0901ae4f5?w=500&auto=format&fit=crop&q=60',
      description: 'Comprehensive AC servicing covering filter cleaning, gas check, and cooling performance.',
      included: ['Deep coil cleaning', 'Filter wash', 'Refrigerant pressure check'],
      availablePincodes: ['700156', '700091'],
      checklist: ['Certified Professional', 'Pressure Washer Included'],
      rating: 4.8,
      reviewsCount: 423,
      isSkilledService: true
    }
  ]);
  return services;
};

module.exports = seedServices;
