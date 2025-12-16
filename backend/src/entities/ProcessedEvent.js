import { EntitySchema } from 'typeorm';

export const ProcessedEvent = new EntitySchema({
  name: 'ProcessedEvent',
  tableName: 'processed_events',
  columns: {
    id: {
      type: 'integer',
      primary: true,
      generated: true
    },
    eventName: {
      type: 'varchar',
      length: 100
    },
    contractAddress: {
      type: 'varchar',
      length: 42
    },
    transactionHash: {
      type: 'varchar',
      length: 66,
      unique: true
    },
    blockNumber: {
      type: 'integer'
    },
    logIndex: {
      type: 'integer'
    },
    processedAt: {
      type: 'datetime',
      createDate: true
    }
  },
  indices: [
    {
      columns: ['transactionHash']
    },
    {
      columns: ['eventName', 'contractAddress']
    },
    {
      columns: ['blockNumber']
    }
  ]
});
