import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface StoryAttributes {
  id: string;
  title: string;
  content: string;
  authorId: string;
  images: string | string[]; // JSON string in DB, array when accessed
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type StoryCreationAttributes = Optional<StoryAttributes, 'id' | 'createdAt' | 'updatedAt' | 'images'>;

class Story extends Model<StoryAttributes, StoryCreationAttributes> implements StoryAttributes {
  public id!: string;
  public title!: string;
  public content!: string;
  public authorId!: string;
  public images!: string | string[];
  public date!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Helper method to get images as array
  getImagesArray(): string[] {
    const value = this.getDataValue('images') as string;
    return value ? JSON.parse(value) : [];
  }
}

Story.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    images: {
      type: DataTypes.TEXT, // Store as JSON string
      allowNull: true,
      defaultValue: '[]',
      get() {
        const value = this.getDataValue('images') as string;
        if (!value) return [];
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      },
      set(value: string[] | string) {
        if (Array.isArray(value)) {
          this.setDataValue('images', JSON.stringify(value));
        } else {
          this.setDataValue('images', value);
        }
      },
    },
    date: {
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
    tableName: 'stories',
    timestamps: true,
  }
);

export default Story;

