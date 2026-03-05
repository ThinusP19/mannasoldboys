import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface YearGroupAttributes {
  id: string;
  year: number;
  groupPhoto?: string; // Keep for backward compatibility
  photos?: string[]; // Array of base64 images (up to 5)
  yearInfo?: string;
  whatsappLink?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface YearGroupCreationAttributes extends Optional<YearGroupAttributes, 'id' | 'createdAt' | 'updatedAt' | 'groupPhoto' | 'yearInfo' | 'whatsappLink'> {}

class YearGroup extends Model<YearGroupAttributes, YearGroupCreationAttributes> implements YearGroupAttributes {
  public id!: string;
  public year!: number;
  public groupPhoto?: string; // Keep for backward compatibility
  declare photos?: string[]; // Array of images
  public yearInfo?: string;
  public whatsappLink?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

YearGroup.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    groupPhoto: {
      type: DataTypes.TEXT, // Store as base64 or URL (backward compatibility)
      allowNull: true,
    },
    photos: {
      type: DataTypes.TEXT, // Store as JSON array
      allowNull: true,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('photos') as any;
        if (!rawValue) return [];
        if (Array.isArray(rawValue)) return rawValue;
        try {
          return JSON.parse(String(rawValue));
        } catch {
          return [];
        }
      },
      set(value: string[] | string) {
        if (Array.isArray(value)) {
          this.setDataValue('photos', JSON.stringify(value) as any);
        } else {
          this.setDataValue('photos', value as any);
        }
      },
    },
    yearInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    whatsappLink: {
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
    tableName: 'year_groups',
    timestamps: true,
  }
);

export default YearGroup;

