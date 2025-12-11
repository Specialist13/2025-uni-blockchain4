import { EntitySchema } from 'typeorm';

export const Product = new EntitySchema({
  name: 'Product',
  tableName: 'products',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true
    },
    seller: {
      type: 'varchar',
      length: 42
    },
    title: {
      type: 'varchar',
      length: 255
    },
    description: {
      type: 'text'
    },
    imageUrl: {
      type: 'varchar',
      length: 500,
      nullable: true
    },
    imageUrls: {
      type: 'simple-array',
      nullable: true
    },
    priceWei: {
      type: 'varchar',
      length: 255
    },
    isActive: {
      type: 'boolean',
      default: true
    },
    createdAt: {
      type: 'datetime',
      createDate: true
    }
  },
  indices: [
    {
      columns: ['seller']
    }
  ],
  relations: {
    orders: {
      type: 'one-to-many',
      target: 'Order',
      inverseSide: 'product'
    }
  }
});
