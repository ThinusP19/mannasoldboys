import User from './User';
import Profile from './Profile';
import YearGroup from './YearGroup';
import Story from './Story';
import Memorial from './Memorial';
import Reunion from './Reunion';
import ReunionRegistration from './ReunionRegistration';
import Project from './Project';
import Donation from './Donation';
import Notification from './Notification';
import MembershipRequest from './MembershipRequest';
import YearGroupPost from './YearGroupPost';
import PushSubscription from './PushSubscription';
import ExpoPushToken from './ExpoPushToken';

// Define associations

// User -> Profile (One-to-One)
User.hasOne(Profile, {
  foreignKey: 'userId',
  as: 'profile',
  onDelete: 'CASCADE',
});
Profile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User -> Stories (One-to-Many)
User.hasMany(Story, {
  foreignKey: 'authorId',
  as: 'stories',
  onDelete: 'CASCADE',
});
Story.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
});

// User -> ReunionRegistrations (One-to-Many)
User.hasMany(ReunionRegistration, {
  foreignKey: 'userId',
  as: 'reunionRegistrations',
  onDelete: 'CASCADE',
});
ReunionRegistration.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Reunion -> ReunionRegistrations (One-to-Many)
Reunion.hasMany(ReunionRegistration, {
  foreignKey: 'reunionId',
  as: 'registrations',
  onDelete: 'CASCADE',
});
ReunionRegistration.belongsTo(Reunion, {
  foreignKey: 'reunionId',
  as: 'reunion',
});

// User -> Donations (One-to-Many)
User.hasMany(Donation, {
  foreignKey: 'userId',
  as: 'donations',
  onDelete: 'CASCADE',
});
Donation.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Project -> Donations (One-to-Many)
Project.hasMany(Donation, {
  foreignKey: 'projectId',
  as: 'donations',
  onDelete: 'CASCADE',
});
Donation.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// User -> Notifications (One-to-Many)
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE',
});
Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User -> MembershipRequests (One-to-Many)
User.hasMany(MembershipRequest, {
  foreignKey: 'userId',
  as: 'membershipRequests',
  onDelete: 'CASCADE',
});
MembershipRequest.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// YearGroup -> YearGroupPosts (One-to-Many)
YearGroup.hasMany(YearGroupPost, {
  foreignKey: 'yearGroupId',
  as: 'posts',
  onDelete: 'CASCADE',
});
YearGroupPost.belongsTo(YearGroup, {
  foreignKey: 'yearGroupId',
  as: 'yearGroup',
});

// User -> YearGroupPosts (One-to-Many)
User.hasMany(YearGroupPost, {
  foreignKey: 'authorId',
  as: 'yearGroupPosts',
  onDelete: 'CASCADE',
});
YearGroupPost.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
});

// User -> PushSubscriptions (One-to-Many)
User.hasMany(PushSubscription, {
  foreignKey: 'userId',
  as: 'pushSubscriptions',
  onDelete: 'CASCADE',
});
PushSubscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User -> ExpoPushTokens (One-to-Many)
User.hasMany(ExpoPushToken, {
  foreignKey: 'userId',
  as: 'expoPushTokens',
  onDelete: 'CASCADE',
});
ExpoPushToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export {
  User,
  Profile,
  YearGroup,
  Story,
  Memorial,
  Reunion,
  ReunionRegistration,
  Project,
  Donation,
  Notification,
  MembershipRequest,
  YearGroupPost,
  PushSubscription,
  ExpoPushToken,
};

