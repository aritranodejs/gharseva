const Category = require('../../models/Category');

const seedCategories = async () => {
  await Category.deleteMany({});
  const categories = await Category.create([
    { name: 'Cleaning', slug: 'cleaning', icon: 'Sparkles', color: '#EEF2FF' },
    { name: 'Plumbing', slug: 'plumbing', icon: 'Droplets', color: '#ECFDF5' },
    { name: 'Electrician', slug: 'electrician', icon: 'Zap', color: '#FFF7ED' },
    { name: 'Painting', slug: 'painting', icon: 'Hammer', color: '#FDF2F8' },
    { name: 'AC Repair', slug: 'ac', icon: 'Snowflake', color: '#F0FDFA' },
    { name: 'Appliance', slug: 'appliance', icon: 'Zap', color: '#EFF6FF' },
    { name: 'Pest Control', slug: 'pest', icon: 'ShieldCheck', color: '#FEF2F2' },
    { name: 'Care', slug: 'care', icon: 'User', color: '#F5F3FF' },
    { name: 'Cook', slug: 'cook', icon: 'Utensils', color: '#FFF7ED' },
  ]);
  return categories;
};

module.exports = seedCategories;
