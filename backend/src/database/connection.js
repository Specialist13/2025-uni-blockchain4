import { AppDataSource } from '../config/database.js';

/**
 * Initialize database connection
 */
export async function connectDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established successfully');
    }
    return AppDataSource;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function disconnectDatabase() {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    throw error;
  }
}

/**
 * Get a repository for an entity
 * @param {Function} entityClass - The entity class
 * @returns {Repository} TypeORM repository
 */
export function getRepository(entityClass) {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return AppDataSource.getRepository(entityClass);
}

/**
 * Get the AppDataSource instance
 * @returns {DataSource} TypeORM DataSource
 */
export function getDataSource() {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return AppDataSource;
}

export default AppDataSource;
