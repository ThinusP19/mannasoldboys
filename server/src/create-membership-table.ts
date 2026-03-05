import sequelize from './db/connection';

async function createMembershipTable() {
  try {
    console.log('🔄 Creating membership_requests table...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if table exists
    const [results]: any = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      AND TABLE_NAME = 'membership_requests'
    `);

    if (results.length > 0) {
      console.log('✅ Table membership_requests already exists.');
      await sequelize.close();
      process.exit(0);
    }

    // Create table without foreign key first
    await sequelize.query(`
      CREATE TABLE [membership_requests] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [userId] CHAR(36) NOT NULL,
        [fullName] NVARCHAR(255) NOT NULL,
        [email] NVARCHAR(255) NOT NULL,
        [phone] NVARCHAR(255) NOT NULL,
        [whatsapp] NVARCHAR(255) NOT NULL,
        [requestedPlan] NVARCHAR(50) NOT NULL,
        [monthlyAmount] INT NOT NULL,
        [status] NVARCHAR(50) NOT NULL,
        [requestedDate] DATETIME2 NOT NULL,
        [approvedDate] DATETIME2 NULL,
        [approvedBy] INT NULL,
        [rejectionReason] NVARCHAR(MAX) NULL,
        [createdAt] DATETIME2 NOT NULL,
        [updatedAt] DATETIME2 NOT NULL
      )
    `);

    // Add foreign key constraint separately
    await sequelize.query(`
      ALTER TABLE [membership_requests]
      ADD CONSTRAINT [FK_membership_requests_userId] 
      FOREIGN KEY ([userId]) REFERENCES [users]([id]) ON DELETE CASCADE
    `);

    // Add default constraints separately
    await sequelize.query(`
      ALTER TABLE [membership_requests]
      ADD CONSTRAINT [DF_membership_requests_status] DEFAULT 'pending' FOR [status]
    `);
    
    await sequelize.query(`
      ALTER TABLE [membership_requests]
      ADD CONSTRAINT [DF_membership_requests_requestedDate] DEFAULT GETDATE() FOR [requestedDate]
    `);
    
    await sequelize.query(`
      ALTER TABLE [membership_requests]
      ADD CONSTRAINT [DF_membership_requests_createdAt] DEFAULT GETDATE() FOR [createdAt]
    `);
    
    await sequelize.query(`
      ALTER TABLE [membership_requests]
      ADD CONSTRAINT [DF_membership_requests_updatedAt] DEFAULT GETDATE() FOR [updatedAt]
    `);

    console.log('✅ Table membership_requests created successfully!');
    
    await sequelize.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating table:', error.message);
    if (error.original) {
      if (Array.isArray(error.original.errors)) {
        error.original.errors.forEach((err: any, idx: number) => {
          console.error(`❌ SQL Error ${idx + 1}:`, err.message);
          console.error(`   Code:`, err.number);
          console.error(`   State:`, err.state);
        });
      } else if (error.original.message) {
        console.error('❌ SQL Error:', error.original.message);
        console.error('   Code:', error.original.number);
        console.error('   State:', error.original.state);
      }
    }
    console.error('SQL Query:', error.sql);
    process.exit(1);
  }
}

createMembershipTable();

