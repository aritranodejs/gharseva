const Category = require('../../models/Category');

const seedCategories = async () => {
  await Category.deleteMany({});
  
  // Use consistent ObjectIds for development persistence
  const categories = await Category.create([
    { _id: '69c80bc4a28060537fa7847a', name: 'Cleaning', slug: 'cleaning', icon: 'sparkles', color: '#EEF2FF' },
    { _id: '69c80bc4a28060537fa7847b', name: 'Plumbing', slug: 'plumbing', icon: 'droplet', color: '#ECFDF5' },
    { _id: '69c80bc4a28060537fa7847c', name: 'Electrician', slug: 'electrician', icon: 'Zap', color: '#FFF7ED' },
    { _id: '69c80bc4a28060537fa7847d', name: 'Painting', slug: 'painting', icon: 'paint-roller', color: '#FDF2F8' },
    { _id: '69c80bc4a28060537fa7847e', name: 'AC Repair', slug: 'ac', icon: 'wind', color: '#F0FDFA' },
    { _id: '69c80bc4a28060537fa7847f', name: 'Appliance', slug: 'appliance', icon: 'tv', color: '#EFF6FF' },
    { _id: '69c80bc4a28060537fa78480', name: 'Pest Control', slug: 'pest', icon: 'bug', color: '#FEF2F2' },
    { _id: '69c80bc4a28060537fa78481', name: 'Care', slug: 'care', icon: 'heart', color: '#F5F3FF' },
    { _id: '69c80bc4a28060537fa78482', name: 'Cook', slug: 'cook', icon: 'utensils', color: '#FFF7ED' },
  ]);
  return categories;
};

module.exports = seedCategories;
