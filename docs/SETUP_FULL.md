# Full Setup Guide

This guide covers setting up the entire project including frontend, backend, and smart contracts.

## Prerequisites

- Node.js and npm installed
- Truffle installed globally or locally
- Ganache CLI (or use Truffle's built-in Ganache)

## Project Structure

```
project-root/
├── contracts/          # Smart contracts
├── migrations/         # Contract migrations
├── test/              # Contract tests
├── backend/           # Backend server
├── frontend/          # Frontend application
└── docs/              # Documentation
```

## Setup Steps

### 1. Install Root Dependencies (for Truffle)

```bash
npm install
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
cd ..
```

### 3. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
cd ..
```

### 4. Deploy Smart Contracts

1. Start Ganache:
```bash
ganache
```

2. Deploy contracts:
```bash
truffle migrate --network development
```

3. Copy contract addresses to:
   - `backend/.env` (MARKETPLACE_CONTRACT_ADDRESS, etc.)
   - `frontend/.env` (VITE_MARKETPLACE_CONTRACT_ADDRESS, etc.)

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Ganache (if not already running):**
```bash
ganache
```

## Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Ganache RPC: http://127.0.0.1:8545

## Notes

- Each directory (`backend/` and `frontend/`) has its own `package.json` and `node_modules/`
- The root `.gitignore` handles ignoring `node_modules/` in all subdirectories
- `.env` files are gitignored, but `.env.example` files are tracked for reference
