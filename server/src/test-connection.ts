import { testConnection, sequelize } from './db/connection';

async function main() {
  console.log('🔌 Testing database connection...');
  console.log('📋 Configuration:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  console.log(`   Encrypt: ${process.env.DB_ENCRYPT}`);
  console.log('');

  const connected = await testConnection();

  if (connected) {
    // Try a simple query
    try {
      const [results] = await sequelize.query('SELECT @@VERSION AS version');
      console.log('✅ Test query executed successfully!');
      console.log('📊 SQL Server version:', (results as any[])[0]?.version);
    } catch (error: any) {
      console.error('❌ Error executing test query:', error.message);
    }

    // Close connection
    await sequelize.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } else {
    console.error('❌ Connection test failed!');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

