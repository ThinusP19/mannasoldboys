import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface ProfileAttributes {
  id: string;
  userId: string;
  name: string;
  year: number;
  bio?: string;
  thenPhoto?: string;
  nowPhoto?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
  phone?: string;
  contactPermission: string;
  verificationStatus?: 'pending' | 'verified';
  securityQuestion?: string;
  securityAnswer?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProfileCreationAttributes extends Optional<ProfileAttributes, 'id' | 'createdAt' | 'updatedAt' | 'bio' | 'thenPhoto' | 'nowPhoto' | 'linkedin' | 'instagram' | 'facebook' | 'email' | 'phone' | 'verificationStatus' | 'securityQuestion' | 'securityAnswer'> {}

class Profile extends Model<ProfileAttributes, ProfileCreationAttributes> implements ProfileAttributes {
  public id!: string;
  public userId!: string;
  public name!: string;
  public year!: number;
  public bio?: string;
  public thenPhoto?: string;
  public nowPhoto?: string;
  public linkedin?: string;
  public instagram?: string;
  public facebook?: string;
  public email?: string;
  public phone?: string;
  public contactPermission!: 'all' | 'year-group' | 'none';
  public verificationStatus?: 'pending' | 'verified';
  public securityQuestion?: string;
  public securityAnswer?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Profile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    thenPhoto: {
      type: DataTypes.TEXT, // Store as base64 or URL
      allowNull: true,
    },
    nowPhoto: {
      type: DataTypes.TEXT, // Store as base64 or URL
      allowNull: true,
    },
    linkedin: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    instagram: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    facebook: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    contactPermission: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'all',
      validate: {
        isIn: [['all', 'year-group', 'none']],
      },
    },
    verificationStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['pending', 'verified']],
      },
    },
    securityQuestion: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    securityAnswer: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    tableName: 'profiles',
    timestamps: true,
  }
);

export default Profile;

