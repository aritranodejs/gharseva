const mongoose = require('mongoose');
const User = require('../../models/User');
const Settings = require('../../models/Settings');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for Admin Seeding...');

        // Check if admin exists
        const adminPhone = '9999999999';
        let admin = await User.findOne({ phoneNumber: adminPhone });

        if (!admin) {
            admin = await User.create({
                phoneNumber: adminPhone,
                name: 'Admin GharSeva',
                email: 'admin@gharseva.com',
                role: 'admin',
                isVerified: true
            });
            console.log('Admin user created successfully');
        } else {
            admin.role = 'admin';
            await admin.save();
            console.log('Admin role updated for existing user');
        }

        // Seed default settings if not exists
        const settings = await Settings.findOne();
        if (!settings) {
            await Settings.create({
                platformFeeType: 'fixed',
                platformFeeValue: 29
            });
            console.log('Default platform fee settings created');
        }

        console.log('Admin Seeding Completed!');
        process.exit();
    } catch (error) {
        console.error('Admin Seeding Error:', error);
        process.exit(1);
    }
};

seedAdmin();
