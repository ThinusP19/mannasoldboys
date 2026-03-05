import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/connection';

interface YearGroupPostAttributes {
  id: string;
  yearGroupId: string;
  authorId: string;
  title: string;
  content: string;
  images: string[]; // JSON array of base64 images or URLs
  createdAt?: Date;
  updatedAt?: Date;
}

interface YearGroupPostCreationAttributes
  extends Optional<YearGroupPostAttributes, 'id' | 'images' | 'createdAt' | 'updatedAt'> {}

class YearGroupPost extends Model<YearGroupPostAttributes, YearGroupPostCreationAttributes>
  implements YearGroupPostAttributes {
  public id!: string;
  public yearGroupId!: string;
  public authorId!: string;
  public title!: string;
  public content!: string;
  declare images: string[]; // Use declare for virtual/computed properties

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

YearGroupPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    yearGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'year_groups',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    authorId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    images: {
      type: DataTypes.TEXT, // Store as JSON string
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
    tableName: 'year_group_posts',
    timestamps: true,
  }
);

export default YearGroupPost;

