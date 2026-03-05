import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface ReunionRegistrationAttributes {
  id: string;
  reunionId: string;
  userId: string;
  status: 'coming' | 'maybe' | 'not_coming';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReunionRegistrationCreationAttributes extends Optional<ReunionRegistrationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ReunionRegistration extends Model<ReunionRegistrationAttributes, ReunionRegistrationCreationAttributes> implements ReunionRegistrationAttributes {
  public id!: string;
  public reunionId!: string;
  public userId!: string;
  public status!: 'coming' | 'maybe' | 'not_coming';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ReunionRegistration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reunionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'reunions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'coming',
      validate: {
        isIn: [['coming', 'maybe', 'not_coming']],
      },
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
    tableName: 'reunion_registrations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['reunionId', 'userId'], // Prevent duplicate registrations
      },
    ],
  }
);

export default ReunionRegistration;

