import { EntitySchema } from 'typeorm';

export const AddressType = {
  Pickup: 'pickup',
  Dropoff: 'dropoff'
};

export const AddressInfo = new EntitySchema({
  name: 'AddressInfo',
  tableName: 'address_info',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true
    },
    shipmentId: {
      type: 'integer'
    },
    type: {
      type: 'varchar',
      length: 20
    },
    name: {
      type: 'varchar',
      length: 255
    },
    line1: {
      type: 'varchar',
      length: 255
    },
    line2: {
      type: 'varchar',
      length: 255,
      nullable: true
    },
    city: {
      type: 'varchar',
      length: 100
    },
    state: {
      type: 'varchar',
      length: 100
    },
    postalCode: {
      type: 'varchar',
      length: 50
    },
    country: {
      type: 'varchar',
      length: 100
    }
  },
  indices: [
    {
      columns: ['shipmentId']
    }
  ],
  relations: {
    shipment: {
      type: 'many-to-one',
      target: 'Shipment',
      joinColumn: {
        name: 'shipmentId'
      },
      inverseSide: 'addresses'
    }
  }
});
