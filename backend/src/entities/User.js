import { EntitySchema } from 'typeorm';

export const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true
    },
    walletAddress: {
      type: 'varchar',
      length: 42,
      nullable: true
    },
    username: {
      type: 'varchar',
      length: 255,
      nullable: true
    },
    email: {
      type: 'varchar',
      length: 255,
      unique: true
    },
    password: {
      type: 'varchar',
      length: 255
    },
    bio: {
      type: 'text',
      nullable: true
    },
    avatarUrl: {
      type: 'varchar',
      length: 500,
      nullable: true
    },
    isActive: {
      type: 'boolean',
      default: true
    },
    createdAt: {
      type: 'datetime',
      createDate: true
    },
    updatedAt: {
      type: 'datetime',
      updateDate: true
    }
  },
  indices: [
    {
      columns: ['email']
    },
    {
      columns: ['walletAddress']
    }
  ]
});
