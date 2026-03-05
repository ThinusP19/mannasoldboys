// Load environment variables first
import './env';
import sequelize from './db/connection';
// Import models to register associations
import './models';

async function syncDatabase() {
  try {
    console.log('🔄 Syncing database...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Sync all models (create tables if they don't exist)
    // Use { alter: true } to update existing tables, or { force: true } to drop and recreate
    // WARNING: { force: true } will drop all tables and data!
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database synchronized successfully!');
    console.log('📊 Tables created/updated:');
    console.log('   - users');
    console.log('   - profiles');
    console.log('   - year_groups');
    console.log('   - stories');
    console.log('   - memorials');
    console.log('   - reunions');
    console.log('   - reunion_registrations');
    console.log('   - projects');
    console.log('   - donations');
    console.log('   - notifications');
    console.log('   - membership_requests');
    console.log('   - year_group_posts');
    console.log('   - push_subscriptions');
    console.log('   - expo_push_tokens');

    await sequelize.close();
    console.log('🔌 Connection closed.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error syncing database:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

syncDatabase();

