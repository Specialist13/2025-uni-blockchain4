.PHONY: help start stop clean update-env ganache backend frontend delete-db

# Default values - can be overridden
GANACHE_PORT ?= 8545
BACKEND_PORT ?= 3001
FRONTEND_PORT ?= 5173

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help:
	@echo "Usage:"
	@echo "  make start          # Start all services (Ganache, backend, frontend)"
	@echo ""
	@echo "Individual targets:"
	@echo "  make ganache       # Start only Ganache with predefined accounts"
	@echo "  make backend       # Start only backend"
	@echo "  make frontend      # Start only frontend"
	@echo "  make stop          # Gracefully stop all services (SIGTERM, then SIGKILL if needed)"
	@echo "  make delete-db     # Delete the SQLite database file"
	@echo "  make clean         # Clean up PID files"
	@echo ""
	@echo "Note: Accounts are loaded from scripts/ganache-accounts.json"

# Start everything
start: update-env ganache
	@echo "$(GREEN)Starting backend and frontend...$(NC)"
	@$(MAKE) backend
	@$(MAKE) frontend

# Update .env files with wallet and key from accounts file
update-env:
	@echo "$(GREEN)Updating environment files from accounts file...$(NC)"
	@./scripts/update-env.sh $(GANACHE_PORT) $(BACKEND_PORT)
	@echo "$(GREEN)Environment files updated!$(NC)"

# Start Ganache with predefined accounts
ganache:
	@if [ -f .ganache.pid ]; then \
		if kill -0 $$(cat .ganache.pid) 2>/dev/null; then \
			echo "$(YELLOW)Ganache is already running (PID: $$(cat .ganache.pid))$(NC)"; \
			exit 0; \
		else \
			rm .ganache.pid; \
		fi; \
	fi
	@./scripts/start-ganache.sh $(GANACHE_PORT)

# Start backend server
backend:
	@if [ -f .backend.pid ]; then \
		if kill -0 $$(cat .backend.pid) 2>/dev/null; then \
			echo "$(YELLOW)Backend is already running (PID: $$(cat .backend.pid))$(NC)"; \
			exit 0; \
		else \
			rm .backend.pid; \
		fi; \
	fi
	@echo "$(GREEN)Starting backend server on port $(BACKEND_PORT)...$(NC)"
	@cd backend && (npm run dev > ../backend.log 2>&1 & echo $$! > ../.backend.pid)
	@sleep 3
	@if command -v pgrep >/dev/null 2>&1; then \
		NODE_PID=$$(pgrep -f "node.*server.js" | grep -v grep | head -1); \
		if [ -n "$$NODE_PID" ]; then \
			echo $$NODE_PID > .backend.pid; \
			echo "$(GREEN)Backend started (Node PID: $$NODE_PID)$(NC)"; \
		else \
			echo "$(GREEN)Backend started (npm PID: $$(cat .backend.pid))$(NC)"; \
		fi; \
	else \
		echo "$(GREEN)Backend started (PID: $$(cat .backend.pid))$(NC)"; \
	fi

# Start frontend server
frontend:
	@if [ -f .frontend.pid ]; then \
		if kill -0 $$(cat .frontend.pid) 2>/dev/null; then \
			echo "$(YELLOW)Frontend is already running (PID: $$(cat .frontend.pid))$(NC)"; \
			exit 0; \
		else \
			rm .frontend.pid; \
		fi; \
	fi
	@echo "$(GREEN)Starting frontend server...$(NC)"
	@cd frontend && (npm run dev > ../frontend.log 2>&1 & echo $$! > ../.frontend.pid)
	@sleep 3
	@if command -v pgrep >/dev/null 2>&1; then \
		VITE_PID=$$(pgrep -f "vite" | grep -v grep | head -1); \
		if [ -n "$$VITE_PID" ]; then \
			echo $$VITE_PID > .frontend.pid; \
			echo "$(GREEN)Frontend started (Vite PID: $$VITE_PID)$(NC)"; \
		else \
			echo "$(GREEN)Frontend started (npm PID: $$(cat .frontend.pid))$(NC)"; \
		fi; \
	else \
		echo "$(GREEN)Frontend started (PID: $$(cat .frontend.pid))$(NC)"; \
	fi

# Stop all services gracefully (in reverse dependency order)
stop:
	@echo "$(GREEN)Stopping services gracefully...$(NC)"
	@./scripts/stop-services.sh

# Delete database file
delete-db:
	@echo "$(YELLOW)Deleting database...$(NC)"
	@if [ -f backend/database.sqlite ]; then \
		rm -f backend/database.sqlite; \
		echo "$(GREEN)Database deleted: backend/database.sqlite$(NC)"; \
	else \
		echo "$(YELLOW)Database file not found: backend/database.sqlite$(NC)"; \
	fi

# Clean up .env files (restore from .env.example if needed)
clean:
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@rm -f .ganache.pid .backend.pid .frontend.pid backend.log frontend.log
	@echo "$(GREEN)Cleanup complete$(NC)"
