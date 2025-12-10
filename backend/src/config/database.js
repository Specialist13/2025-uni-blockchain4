import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';

// Import entities explicitly (required for ES modules)
import { Product } from '../entities/Product.js';
import { Order } from '../entities/Order.js';
import { Escrow } from '../entities/Escrow.js';
import { Shipment } from '../entities/Shipment.js';
import { AddressInfo } from '../entities/AddressInfo.js';
import { User } from '../entities/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the backend root directory (two levels up from src/config)
const backendRoot = path.resolve(__dirname, '../..');

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: join(backendRoot, 'database.sqlite'),
  entities: [Product, Order, Escrow, Shipment, AddressInfo, User],
  synchronize: process.env.NODE_ENV !== 'production', // Auto-sync schema in development
  logging: process.env.NODE_ENV === 'development',
});
