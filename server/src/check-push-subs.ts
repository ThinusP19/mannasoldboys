// Load environment variables first
import './env';
import sequelize from './db/connection';

async function checkPushSubs() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check push_subscriptions table
    const [subs] = await sequelize.query(`SELECT * FROM push_subscriptions`) as [any[], unknown];
    console.log('\n📱 Push Subscriptions:', subs.length);
    subs.forEach((sub: any) => {
      console.log(`  - User: ${sub.userId}, Endpoint: ${sub.endpoint.substring(0, 60)}...`);
    });

    if (subs.length === 0) {
      console.log('\n⚠️  No push subscriptions found! Users need to enable push notifications first.');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPushSubs();
