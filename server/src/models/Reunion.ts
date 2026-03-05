import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface ReunionAttributes {
  id: string;
  title: string;
  date: Date;
  location: string;
  description?: string;
  targetYearGroups?: string; // JSON array of years [2020, 2021, 2022]
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReunionCreationAttributes extends Optional<ReunionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description'> {}

class Reunion extends Model<ReunionAttributes, ReunionCreationAttributes> implements ReunionAttributes {
  public id!: string;
  public title!: string;
  public date!: Date;
  public location!: string;
  public description?: string;
  public targetYearGroups?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Helper method to get target year groups as array
  getTargetYearGroups(): number[] {
    if (!this.targetYearGroups) return [];
    try {
      return JSON.parse(this.targetYearGroups);
    } catch {
      return [];
    }
  }
}

Reunion.init(
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
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    targetYearGroups: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]',
      get() {
        const value = this.getDataValue('targetYearGroups') as string;
        if (!value) return [];
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      },
      set(value: number[] | string) {
        if (Array.isArray(value)) {
          this.setDataValue('targetYearGroups', JSON.stringify(value));
        } else {
          this.setDataValue('targetYearGroups', value);
        }
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
    tableName: 'reunions',
    timestamps: true,
  }
);

export default Reunion;

