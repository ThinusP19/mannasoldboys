import sequelize from './db/connection';
import { QueryTypes } from 'sequelize';

async function addPasswordResetField() {
  try {
    console.log('🔄 Adding hasPasswordResetRequest field to users table...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if column already exists
    const checkColumn = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'hasPasswordResetRequest'
    `, { type: QueryTypes.SELECT });

    if (Array.isArray(checkColumn) && checkColumn.length > 0) {
      console.log('✅ Column hasPasswordResetRequest already exists.');
      await sequelize.close();
      process.exit(0);
    }

    // Add the column
    console.log('🔄 Adding hasPasswordResetRequest column...');
    await sequelize.query(`
      ALTER TABLE [users] 
      ADD [hasPasswordResetRequest] BIT NOT NULL DEFAULT 0;
    `, { type: QueryTypes.RAW });
    
    console.log('✅ Column hasPasswordResetRequest added successfully!');

    await sequelize.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error adding column:', error.message);
    console.error('Error details:', error);
    await sequelize.close();
    process.exit(1);
  }
}

addPasswordResetField();

