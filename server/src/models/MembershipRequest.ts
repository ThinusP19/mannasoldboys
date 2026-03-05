import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface MembershipRequestAttributes {
  id: number;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  requestedPlan: 'bronze' | 'silver' | 'gold';
  monthlyAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedDate: Date;
  approvedDate?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MembershipRequestCreationAttributes
  extends Optional<MembershipRequestAttributes, 'id' | 'status' | 'requestedDate' | 'approvedDate' | 'approvedBy' | 'rejectionReason' | 'createdAt' | 'updatedAt'> {}

class MembershipRequest extends Model<MembershipRequestAttributes, MembershipRequestCreationAttributes>
  implements MembershipRequestAttributes {
  public id!: number;
  public userId!: string;
  public fullName!: string;
  public email!: string;
  public phone!: string;
  public whatsapp!: string;
  public requestedPlan!: 'bronze' | 'silver' | 'gold';
  public monthlyAmount!: number;
  public status!: 'pending' | 'approved' | 'rejected';
  public requestedDate!: Date;
  public approvedDate?: Date;
  public approvedBy?: string;
  public rejectionReason?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MembershipRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
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
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requestedPlan: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'custom',
      validate: {
        isIn: [['bronze', 'silver', 'gold', 'custom']],
      },
    },
    monthlyAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
      allowNull: false,
      validate: {
        isIn: [['pending', 'approved', 'rejected']],
      },
    },
    requestedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    approvedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'membership_requests',
    timestamps: true,
  }
);

export default MembershipRequest;
