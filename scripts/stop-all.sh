#!/bin/bash

# Script to gracefully stop all services
# Can be used standalone or called from Makefile

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Stopping services gracefully...${NC}"

# Function to stop a process gracefully
stop_process() {
    local PID_FILE=$1
    local NAME=$2
    
    if [ ! -f "$PID_FILE" ]; then
        return 0
    fi
    
    local PID=$(cat "$PID_FILE")
    
    if ! kill -0 "$PID" 2>/dev/null; then
        echo -e "${YELLOW}$NAME process (PID: $PID) not running, cleaning up PID file...${NC}"
        rm -f "$PID_FILE"
        return 0
    fi
    
    echo -e "${GREEN}Sending SIGTERM to $NAME (PID: $PID)...${NC}"
    kill -TERM "$PID" 2>/dev/null || true
    
    # Wait up to 5 seconds for graceful shutdown
    local count=0
    while [ $count -lt 5 ]; do
        if ! kill -0 "$PID" 2>/dev/null; then
            echo -e "${GREEN}$NAME stopped gracefully${NC}"
            rm -f "$PID_FILE"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    
    # If still running, force kill
    if kill -0 "$PID" 2>/dev/null; then
        echo -e "${YELLOW}$NAME still running after SIGTERM, sending SIGKILL...${NC}"
        kill -KILL "$PID" 2>/dev/null || true
        sleep 1
        if ! kill -0 "$PID" 2>/dev/null; then
            echo -e "${GREEN}$NAME stopped${NC}"
        else
            echo -e "${YELLOW}Warning: $NAME may still be running${NC}"
        fi
    fi
    
    rm -f "$PID_FILE"
}

# Stop in reverse dependency order
stop_process "$PROJECT_ROOT/.frontend.pid" "Frontend"
stop_process "$PROJECT_ROOT/.backend.pid" "Backend"
stop_process "$PROJECT_ROOT/.ganache.pid" "Ganache"

echo -e "${GREEN}All services stopped${NC}"
