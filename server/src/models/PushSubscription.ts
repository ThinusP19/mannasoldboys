import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface PushSubscriptionAttributes {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PushSubscriptionCreationAttributes extends Optional<PushSubscriptionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PushSubscription extends Model<PushSubscriptionAttributes, PushSubscriptionCreationAttributes> implements PushSubscriptionAttributes {
  public id!: string;
  public userId!: string;
  public endpoint!: string;
  public p256dh!: string;
  public auth!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PushSubscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true, // Each endpoint should only be stored once
    },
    p256dh: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    auth: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'push_subscriptions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'], // For efficient querying by user
      },
      {
        fields: ['endpoint'],
        unique: true, // Ensure endpoint uniqueness
      },
    ],
  }
);

export default PushSubscription;
