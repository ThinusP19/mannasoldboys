import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface NotificationAttributes {
  id: string;
  userId: string;
  type: 'reunion' | 'story' | 'member' | 'project' | 'general' | 'password-reset' | 'admin_action' | 'memorial';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'createdAt' | 'updatedAt' | 'read' | 'timestamp'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public userId!: string;
  public type!: 'reunion' | 'story' | 'member' | 'project' | 'general' | 'password-reset' | 'admin_action' | 'memorial';
  public title!: string;
  public message!: string;
  public read!: boolean;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
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
    type: {
      type: DataTypes.STRING(50),
      validate: {
        isIn: [['reunion', 'story', 'member', 'project', 'general', 'password-reset', 'admin_action', 'memorial']],
      },
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'read'], // For efficient querying of user notifications
      },
    ],
  }
);

export default Notification;

