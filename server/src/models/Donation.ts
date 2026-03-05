import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface DonationAttributes {
  id: string;
  projectId: string;
  userId: string;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type DonationCreationAttributes = Optional<DonationAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class Donation extends Model<DonationAttributes, DonationCreationAttributes> implements DonationAttributes {
  public id!: string;
  public projectId!: string;
  public userId!: string;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Donation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
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
    amount: {
      type: DataTypes.DECIMAL(12, 2),
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
    tableName: 'donations',
    timestamps: true,
  }
);

export default Donation;

