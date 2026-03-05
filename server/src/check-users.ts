import './env';
import sequelize from './db/connection';

async function check() {
  try {
    await sequelize.authenticate();

    // Get push subscription user
    const [subs] = await sequelize.query('SELECT userId FROM push_subscriptions') as [any[], unknown];
    console.log('\n📱 Push subscription user ID:', subs[0]?.userId || 'NONE');

    // Get admin users
    const [admins] = await sequelize.query("SELECT id, email, name FROM users WHERE role = 'admin'") as [any[], unknown];
    console.log('\n👑 Admin users:');
    admins.forEach((a: any) => console.log(`  - ${a.id} (${a.email})`));

    // Check if same
    if (subs[0]?.userId && admins.some((a: any) => a.id === subs[0].userId)) {
      console.log('\n⚠️  SAME USER! Admin is the only subscribed user.');
      console.log('   You need a DIFFERENT user logged in on Safari to receive push notifications.');
    }

    await sequelize.close();
  } catch (e: any) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
check();
