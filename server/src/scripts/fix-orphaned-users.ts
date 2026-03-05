import User from '../models/User';
import Profile from '../models/Profile';
import '../models'; // Register associations

async function fixOrphanedUsers() {
  console.log('Finding orphaned users (users without profiles)...');

  // Find all users who don't have a profile
  const users = await User.findAll({
    include: [{
      model: Profile,
      as: 'profile',
      required: false, // LEFT JOIN
    }],
  });

  // Only fix alumni users - admins don't need profiles
  const orphanedUsers = users.filter(user => !(user as any).profile && user.role === 'alumni');

  console.log(`Found ${orphanedUsers.length} orphaned users`);

  if (orphanedUsers.length === 0) {
    console.log('No orphaned users to fix!');
    return;
  }

  // Create profiles for each orphaned user
  for (const user of orphanedUsers) {
    console.log(`Creating profile for user: ${user.email} (ID: ${user.id})`);

    await Profile.create({
      userId: String(user.id),
      name: user.name,
      year: new Date().getFullYear(),
      contactPermission: 'all',
    });
  }

  console.log(`✅ Created ${orphanedUsers.length} missing profiles`);
}

// Run the script
fixOrphanedUsers()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
