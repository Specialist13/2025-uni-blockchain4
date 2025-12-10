import { EntitySchema } from 'typeorm';

export const ShipmentStatus = {
  Assigned: 'Assigned',
  InTransit: 'InTransit',
  Delivered: 'Delivered'
};

export const Shipment = new EntitySchema({
  name: 'Shipment',
  tableName: 'shipments',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true
    },
    orderId: {
      type: 'integer',
      unique: true
    },
    courier: {
      type: 'varchar',
      length: 42
    },
    trackingNumber: {
      type: 'varchar',
      length: 100,
      unique: true
    },
    status: {
      type: 'varchar',
      length: 50,
      default: ShipmentStatus.Assigned
    },
    createdAt: {
      type: 'datetime',
      createDate: true
    },
    pickedUpAt: {
      type: 'datetime',
      nullable: true
    },
    deliveredAt: {
      type: 'datetime',
      nullable: true
    }
  },
  indices: [
    {
      columns: ['orderId']
    },
    {
      columns: ['courier']
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
      inverseSide: 'shipment'
    },
    addresses: {
      type: 'one-to-many',
      target: 'AddressInfo',
      inverseSide: 'shipment'
    }
  }
});
