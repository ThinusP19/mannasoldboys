import sequelize from './db/connection';
import { QueryTypes } from 'sequelize';

async function addSecurityFields() {
  try {
    console.log('🔄 Adding securityQuestion and securityAnswer fields to profiles table...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if securityQuestion column exists
    const checkSecurityQuestion = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'securityQuestion'
    `, { type: QueryTypes.SELECT });

    if (Array.isArray(checkSecurityQuestion) && checkSecurityQuestion.length === 0) {
      console.log('🔄 Adding securityQuestion column...');
      await sequelize.query(`
        ALTER TABLE [profiles] 
        ADD [securityQuestion] NVARCHAR(500) NULL;
      `, { type: QueryTypes.RAW });
      console.log('✅ Column securityQuestion added successfully!');
    } else {
      console.log('✅ Column securityQuestion already exists.');
    }

    // Check if securityAnswer column exists
    const checkSecurityAnswer = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'securityAnswer'
    `, { type: QueryTypes.SELECT });

    if (Array.isArray(checkSecurityAnswer) && checkSecurityAnswer.length === 0) {
      console.log('🔄 Adding securityAnswer column...');
      await sequelize.query(`
        ALTER TABLE [profiles] 
        ADD [securityAnswer] NVARCHAR(500) NULL;
      `, { type: QueryTypes.RAW });
      console.log('✅ Column securityAnswer added successfully!');
    } else {
      console.log('✅ Column securityAnswer already exists.');
    }

    await sequelize.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error adding columns:', error.message);
    console.error('Error details:', error);
    await sequelize.close();
    process.exit(1);
  }
}

addSecurityFields();

