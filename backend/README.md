# Backend Server

Backend API server for the C2C Marketplace.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your contract addresses after deploying contracts.

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:3001` by default.

## API Endpoints

- `GET /api/health` - Health check endpoint

More endpoints will be added as development progresses.
