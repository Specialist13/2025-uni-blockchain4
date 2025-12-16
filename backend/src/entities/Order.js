import { EntitySchema } from 'typeorm';

export const OrderStatus = {
  PendingPayment: 'PendingPayment',
  PaymentSecured: 'PaymentSecured',
  PreparingShipment: 'PreparingShipment',
  InTransit: 'InTransit',
  Delivered: 'Delivered',
  BuyerConfirmed: 'BuyerConfirmed',
  Completed: 'Completed'
};

export const Order = new EntitySchema({
  name: 'Order',
  tableName: 'orders',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: false
    },
    productId: {
      type: 'integer'
    },
    buyer: {
      type: 'varchar',
      length: 42
    },
    seller: {
      type: 'varchar',
      length: 42
    },
    escrowId: {
      type: 'integer',
      nullable: true
    },
    courierJobId: {
      type: 'integer',
      nullable: true
    },
    status: {
      type: 'varchar',
      length: 50,
      default: OrderStatus.PendingPayment
    },
    createdAt: {
      type: 'datetime',
      createDate: true
    }
  },
  indices: [
    {
      columns: ['productId']
    },
    {
      columns: ['buyer']
    },
    {
      columns: ['seller']
    }
  ],
  relations: {
    product: {
      type: 'many-to-one',
      target: 'Product',
      joinColumn: {
        name: 'productId'
      },
      inverseSide: 'orders'
    },
    escrow: {
      type: 'one-to-one',
      target: 'Escrow',
      inverseSide: 'order'
    },
    shipment: {
      type: 'one-to-one',
      target: 'Shipment',
      inverseSide: 'order'
    }
  }
});
