import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface ExpoPushTokenAttributes {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExpoPushTokenCreationAttributes extends Optional<ExpoPushTokenAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ExpoPushToken extends Model<ExpoPushTokenAttributes, ExpoPushTokenCreationAttributes> implements ExpoPushTokenAttributes {
  public id!: string;
  public userId!: string;
  public token!: string;
  public platform!: 'ios' | 'android';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExpoPushToken.init(
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
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true, // Each Expo push token should only be stored once
    },
    platform: {
      type: DataTypes.ENUM('ios', 'android'),
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
    tableName: 'expo_push_tokens',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'], // For efficient querying by user
      },
      {
        fields: ['token'],
        unique: true, // Ensure token uniqueness
      },
    ],
  }
);

export default ExpoPushToken;
