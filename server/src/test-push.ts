import './env';
import sequelize from './db/connection';
import { sendPushToUser } from './utils/push';

async function testPush() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get the subscribed user
    const [subs] = await sequelize.query('SELECT userId FROM push_subscriptions') as [any[], unknown];

    if (subs.length === 0) {
      console.log('❌ No push subscriptions found!');
      process.exit(1);
    }

    const userId = subs[0].userId;
    console.log(`\n📱 Sending test push to user: ${userId}`);

    await sendPushToUser(userId, {
      title: '🎉 Test Push Notification',
      body: 'If you see this, push notifications are working!',
      data: {
        type: 'test',
        url: '/notifications',
      },
    });

    console.log('\n✅ Push sent! Check your browser for the notification.');

    await sequelize.close();
    process.exit(0);
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    console.error(e);
    process.exit(1);
  }
}

testPush();
