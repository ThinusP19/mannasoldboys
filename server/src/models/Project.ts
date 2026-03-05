import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface ProjectAttributes {
  id: string;
  title: string;
  description?: string;
  goal?: number;
  raised: number;
  images?: string[]; // Array of base64 image strings
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  branchCode?: string;
  reference?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description' | 'goal' | 'raised' | 'images' | 'bankName' | 'accountNumber' | 'accountHolder' | 'branchCode' | 'reference'> {}

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string;
  public title!: string;
  public description?: string;
  public goal?: number;
  public raised!: number;
  public images?: string[];
  public bankName?: string;
  public accountNumber?: string;
  public accountHolder?: string;
  public branchCode?: string;
  public reference?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    raised: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    images: {
      type: DataTypes.TEXT, // Store as JSON string (SQL Server doesn't support JSON type)
      allowNull: true,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('images') as any;
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
          this.setDataValue('images', JSON.stringify(value) as any);
        } else {
          this.setDataValue('images', value as any);
        }
      },
    },
    bankName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    accountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    accountHolder: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    branchCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING(100),
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
    tableName: 'projects',
    timestamps: true,
  }
);

export default Project;

