import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { BlockchainService } from './services/BlockchainService.js';
import { EventIndexerService } from './services/EventIndexerService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// API routes
import routes from './routes/index.js';
app.use('/api', routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  const errorDetails = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errorDetails && { details: errorDetails })
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    await connectDatabase();
    
    // Initialize blockchain service (non-blocking - will warn if not configured)
    try {
      BlockchainService.initialize();
      console.log('Blockchain service initialized successfully');
      
      // Start event indexer (non-blocking - will warn if not configured)
      try {
        await EventIndexerService.start();
        console.log('Event indexer started successfully');
      } catch (error) {
        console.warn('Event indexer initialization failed:', error.message);
      }
    } catch (error) {
      console.warn('Blockchain service initialization failed (contracts may not be available):', error.message);
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await EventIndexerService.stop();
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await EventIndexerService.stop();
  await disconnectDatabase();
  process.exit(0);
});

startServer();
