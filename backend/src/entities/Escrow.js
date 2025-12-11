import { EntitySchema } from 'typeorm';

export const EscrowStatus = {
  Initialized: 'Initialized',
  Funded: 'Funded',
  CourierFeePaid: 'CourierFeePaid',
  AwaitingDelivery: 'AwaitingDelivery',
  Released: 'Released'
};

export const Escrow = new EntitySchema({
  name: 'Escrow',
  tableName: 'escrows',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true
    },
    buyer: {
      type: 'varchar',
      length: 42
    },
    seller: {
      type: 'varchar',
      length: 42
    },
    orderId: {
      type: 'integer',
      unique: true
    },
    amountWei: {
      type: 'varchar',
      length: 255
    },
    courierFeeWei: {
      type: 'varchar',
      length: 255
    },
    platformFeeWei: {
      type: 'varchar',
      length: 255
    },
    fundsSecured: {
      type: 'boolean',
      default: false
    },
    courierFeeTransferred: {
      type: 'boolean',
      default: false
    },
    releasedToSeller: {
      type: 'boolean',
      default: false
    },
    status: {
      type: 'varchar',
      length: 50,
      default: EscrowStatus.Initialized
    },
    createdAt: {
      type: 'datetime',
      createDate: true
    },
    closedAt: {
      type: 'datetime',
      nullable: true
    }
  },
  indices: [
    {
      columns: ['buyer']
    },
    {
      columns: ['seller']
    },
    {
      columns: ['orderId']
    }
  ],
  relations: {
    order: {
      type: 'one-to-one',
      target: 'Order',
      joinColumn: {
        name: 'orderId',
        referencedColumnName: 'id'
      },
      inverseSide: 'escrow'
    }
  }
});
