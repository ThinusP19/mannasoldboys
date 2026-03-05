// Load environment variables first
import './env';
import sequelize from './db/connection';

async function createPushTable() {
  try {
    console.log('🔄 Creating push_subscriptions table...');

    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Create the push_subscriptions table
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='push_subscriptions' AND xtype='U')
      BEGIN
        CREATE TABLE push_subscriptions (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          userId CHAR(36) NOT NULL,
          endpoint NVARCHAR(MAX) NOT NULL,
          p256dh NVARCHAR(255) NOT NULL,
          auth NVARCHAR(255) NOT NULL,
          createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_push_subscriptions_users FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IX_push_subscriptions_userId ON push_subscriptions(userId);
        PRINT 'Table push_subscriptions created successfully';
      END
      ELSE
      BEGIN
        PRINT 'Table push_subscriptions already exists';
      END
    `);

    console.log('✅ push_subscriptions table ready!');

    // Also create expo_push_tokens table if it doesn't exist
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='expo_push_tokens' AND xtype='U')
      BEGIN
        CREATE TABLE expo_push_tokens (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          userId CHAR(36) NOT NULL,
          token NVARCHAR(255) NOT NULL,
          createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_expo_push_tokens_users FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IX_expo_push_tokens_userId ON expo_push_tokens(userId);
        CREATE UNIQUE INDEX IX_expo_push_tokens_token ON expo_push_tokens(token);
        PRINT 'Table expo_push_tokens created successfully';
      END
      ELSE
      BEGIN
        PRINT 'Table expo_push_tokens already exists';
      END
    `);

    console.log('✅ expo_push_tokens table ready!');

    await sequelize.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating tables:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

createPushTable();
