import { getRepository } from '../database/connection.js';
import { ProcessedEvent } from '../entities/ProcessedEvent.js';

export class ProcessedEventRepository {
  static getRepository() {
    return getRepository(ProcessedEvent);
  }

  static async findByTransactionHash(transactionHash) {
    const repository = this.getRepository();
    return await repository.findOne({ where: { transactionHash } });
  }

  static async isProcessed(transactionHash, logIndex) {
    const repository = this.getRepository();
    const existing = await repository.findOne({ 
      where: { transactionHash, logIndex } 
    });
    return !!existing;
  }

  static async create(eventData) {
    const repository = this.getRepository();
    const processedEvent = repository.create(eventData);
    return await repository.save(processedEvent);
  }

  static async getLastProcessedBlock(contractAddress) {
    const repository = this.getRepository();
    const result = await repository
      .createQueryBuilder('event')
      .select('MAX(event.blockNumber)', 'maxBlock')
      .where('event.contractAddress = :contractAddress', { contractAddress })
      .getRawOne();
    
    return result?.maxBlock || 0;
  }

  static async getProcessedEventsInRange(contractAddress, fromBlock, toBlock) {
    const repository = this.getRepository();
    return await repository
      .createQueryBuilder('event')
      .where('event.contractAddress = :contractAddress', { contractAddress })
      .andWhere('event.blockNumber >= :fromBlock', { fromBlock })
      .andWhere('event.blockNumber <= :toBlock', { toBlock })
      .orderBy('event.blockNumber', 'ASC')
      .addOrderBy('event.logIndex', 'ASC')
      .getMany();
  }
}
