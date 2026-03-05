import dotenv from 'dotenv';
import sequelize from './db/connection';
import './models'; // Import to register models
import User from './models/User';
import { hashPassword } from './utils/password';

// Load environment variables
dotenv.config();

async function createAdminUser() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    const adminEmail = 'admin@potchgim.co.za';
    const adminPassword = 'Admin123!potch##GIM';
    const adminName = 'Admin User';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      
      // Update the existing admin user to ensure it has the correct password and role
      const hashedPassword = await hashPassword(adminPassword);
      await existingAdmin.update({
        password: hashedPassword,
        role: 'admin',
        name: adminName,
      });
      
      console.log('✅ Admin user updated successfully!');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Password:', adminPassword);
      console.log('👤 Role: admin');
    } else {
      // Create new admin user
      console.log('🆕 Creating admin user...');
      
      const hashedPassword = await hashPassword(adminPassword);
      
      const adminUser = await User.create({
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'admin',
        isMember: true, // Admin is a member by default
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Password:', adminPassword);
      console.log('👤 Name:', adminName);
      console.log('👑 Role: admin');
      console.log('🆔 User ID:', adminUser.id);
    }

    await sequelize.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

createAdminUser();

