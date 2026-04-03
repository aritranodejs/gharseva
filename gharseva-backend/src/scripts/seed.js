require('dotenv').config({ path: __dirname + '/../../.env' });
const connectDB = require('../config/db');

// Import Seeders
const seedCategories = require('./seeders/categorySeeder');
const seedServices = require('./seeders/serviceSeeder');
const seedFAQs = require('./seeders/faqSeeder');
const seedWorkers = require('./seeders/workerSeeder');
const seedPackages = require('./seeders/packageSeeder');
const seedNotifications = require('./seeders/notificationSeeder');
const seedAreas = require('./seeders/areaSeeder');
const seedPremium = require('./seeders/premiumSeeder');

const runSeeders = async () => {
  try {
    await connectDB();
    console.log('--- Starting Database Seeding ---');

    console.log('Seeding Categories...');
    await seedCategories();

    console.log('Seeding Services...');
    const services = await seedServices();
    
    console.log('Seeding Packages...');
    await seedPackages(services);
    
    console.log('Seeding Workers...');
    await seedWorkers();
    
    console.log('Seeding FAQs...');
    await seedFAQs();
    
    console.log('Seeding Notifications...');
    await seedNotifications();

    console.log('Seeding Serviceable Areas...');
    await seedAreas();

    console.log('Seeding Premium Lifestyle Packages...');
    await seedPremium();

    console.log('--- All Seeders Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error(`Seeding Failed: ${err.message}`);
    process.exit(1);
  }
};

runSeeders();
