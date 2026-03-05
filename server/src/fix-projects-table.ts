import sequelize from './db/connection';
import { QueryTypes } from 'sequelize';

async function fixProjectsTable() {
  try {
    console.log('🔄 Fixing projects table...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if images column exists and what type it is
    const checkColumn = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = 'images'
    `, { type: QueryTypes.SELECT });

    console.log('Current images column:', checkColumn);

    // Check if column exists
    if (Array.isArray(checkColumn) && checkColumn.length > 0) {
      const columnInfo = checkColumn[0] as any;
      console.log(`Current type: ${columnInfo.DATA_TYPE}`);
      
      // If it's not TEXT/NTEXT/NVARCHAR, alter it
      if (columnInfo.DATA_TYPE !== 'text' && columnInfo.DATA_TYPE !== 'ntext' && columnInfo.DATA_TYPE !== 'nvarchar') {
        console.log('🔄 Altering images column to NTEXT...');
        await sequelize.query(`
          ALTER TABLE [projects] 
          ALTER COLUMN [images] NTEXT NULL;
        `, { type: QueryTypes.RAW });
        console.log('✅ Images column altered to NTEXT');
      } else {
        console.log('✅ Images column is already TEXT/NTEXT type');
      }
    } else {
      // Column doesn't exist, add it
      console.log('🔄 Adding images column as NTEXT...');
      await sequelize.query(`
        ALTER TABLE [projects] 
        ADD [images] NTEXT NULL;
      `, { type: QueryTypes.RAW });
      console.log('✅ Images column added');
    }

    // Check and add other missing columns
    const columnsToCheck = [
      { name: 'bankName', type: 'NVARCHAR(255)' },
      { name: 'accountNumber', type: 'NVARCHAR(50)' },
      { name: 'accountHolder', type: 'NVARCHAR(255)' },
      { name: 'branchCode', type: 'NVARCHAR(20)' },
      { name: 'reference', type: 'NVARCHAR(100)' },
    ];

    for (const col of columnsToCheck) {
      const exists = await sequelize.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'projects' AND COLUMN_NAME = '${col.name}'
      `, { type: QueryTypes.SELECT });

      if (Array.isArray(exists) && exists.length === 0) {
        console.log(`🔄 Adding ${col.name} column...`);
        await sequelize.query(`
          ALTER TABLE [projects] 
          ADD [${col.name}] ${col.type} NULL;
        `, { type: QueryTypes.RAW });
        console.log(`✅ ${col.name} column added`);
      } else {
        console.log(`✅ ${col.name} column already exists`);
      }
    }

    console.log('✅ Projects table fixed successfully!');
    
    await sequelize.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error fixing projects table:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

fixProjectsTable();

