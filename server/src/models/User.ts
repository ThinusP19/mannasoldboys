import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface UserAttributes {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'alumni';
  isMember: boolean;
  monthlyAmount?: number;
  membershipTier?: 'bronze' | 'silver' | 'gold';
  membershipStatus?: 'pending' | 'active' | 'expired' | 'cancelled';
  membershipStartDate?: Date;
  hasPasswordResetRequest?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isMember' | 'monthlyAmount' | 'membershipTier' | 'membershipStatus' | 'membershipStartDate'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: 'admin' | 'alumni';
  public isMember!: boolean;
  public monthlyAmount?: number;
  public membershipTier?: 'bronze' | 'silver' | 'gold';
  public membershipStatus?: 'pending' | 'active' | 'expired' | 'cancelled';
  public membershipStartDate?: Date;
  public hasPasswordResetRequest?: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'alumni',
      validate: {
        isIn: [['admin', 'alumni']],
      },
    },
    isMember: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    monthlyAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    membershipTier: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['bronze', 'silver', 'gold']],
      },
    },
    membershipStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['pending', 'active', 'expired', 'cancelled']],
      },
    },
    membershipStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hasPasswordResetRequest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: 'users',
    timestamps: true,
  }
);

export default User;

