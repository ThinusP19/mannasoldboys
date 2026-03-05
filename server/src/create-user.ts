import dotenv from 'dotenv';
import sequelize from './db/connection';
import './models'; // Import to register models
import User from './models/User';
import { hashPassword } from './utils/password';

// Load environment variables
dotenv.config();

async function createOrUpdateUser() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    const userEmail = 'thinuspretorius3@gmail.com';
    const userPassword = 'mirtie123!YQLL2JUGO';
    const userName = 'supermanadmin';

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: userEmail } });
    
    if (existingUser) {
      console.log('⚠️  User already exists! Updating password...');
      
      // Update the existing user with the correct password
      const hashedPassword = await hashPassword(userPassword);
      await existingUser.update({
        password: hashedPassword,
        name: userName,
        role: 'admin', // Set as admin
        isMember: true,
      });
      
      console.log('✅ User updated successfully!');
      console.log('📧 Email:', userEmail);
      console.log('🔑 Password:', userPassword);
      console.log('👤 Name:', userName);
      console.log('👑 Role: admin');
    } else {
      // Create new user
      console.log('🆕 Creating user...');
      
      const hashedPassword = await hashPassword(userPassword);
      
      const newUser = await User.create({
        email: userEmail,
        password: hashedPassword,
        name: userName,
        role: 'admin',
        isMember: true,
      });
      
      console.log('✅ User created successfully!');
      console.log('📧 Email:', userEmail);
      console.log('🔑 Password:', userPassword);
      console.log('👤 Name:', userName);
      console.log('👑 Role: admin');
      console.log('🆔 User ID:', newUser.id);
    }

    await sequelize.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

createOrUpdateUser();

