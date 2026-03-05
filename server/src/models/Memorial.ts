import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface MemorialAttributes {
  id: string;
  name: string;
  year: number;
  photo?: string;
  imageLink?: string;
  tribute: string;
  dateOfPassing: Date;
  funeralDate?: Date;
  funeralLocation?: string;
  contactNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MemorialCreationAttributes extends Optional<MemorialAttributes, 'id' | 'createdAt' | 'updatedAt' | 'photo' | 'imageLink' | 'funeralDate' | 'funeralLocation' | 'contactNumber'> {}

class Memorial extends Model<MemorialAttributes, MemorialCreationAttributes> implements MemorialAttributes {
  public id!: string;
  public name!: string;
  public year!: number;
  public photo?: string;
  public imageLink?: string;
  public tribute!: string;
  public dateOfPassing!: Date;
  public funeralDate?: Date;
  public funeralLocation?: string;
  public contactNumber?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Memorial.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    photo: {
      type: DataTypes.TEXT, // Store as base64 or URL
      allowNull: true,
    },
    imageLink: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    tribute: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dateOfPassing: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    funeralDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    funeralLocation: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    contactNumber: {
      type: DataTypes.STRING(50),
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
    tableName: 'memorials',
    timestamps: true,
  }
);

export default Memorial;

