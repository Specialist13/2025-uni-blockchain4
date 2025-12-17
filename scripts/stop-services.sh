#!/bin/bash

# Script to gracefully stop all services
# Handles npm child processes correctly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to kill process and its children
kill_process_tree() {
    local PID=$1
    local NAME=$2
    
    if [ -z "$PID" ] || ! kill -0 "$PID" 2>/dev/null; then
        return 0
    fi
    
    # Kill all children first
    if command -v pstree >/dev/null 2>&1; then
        pstree -p "$PID" | grep -oP '\(\K[0-9]+' | xargs -r kill -TERM 2>/dev/null || true
    elif command -v pgrep >/dev/null 2>&1; then
        # Find child processes
        pgrep -P "$PID" | xargs -r kill -TERM 2>/dev/null || true
    fi
    
    # Kill the main process
    kill -TERM "$PID" 2>/dev/null || true
}

# Function to stop by PID file
stop_by_pid_file() {
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
    kill_process_tree "$PID" "$NAME"
    
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
        # Kill children with SIGKILL
        if command -v pstree >/dev/null 2>&1; then
            pstree -p "$PID" | grep -oP '\(\K[0-9]+' | xargs -r kill -KILL 2>/dev/null || true
        elif command -v pgrep >/dev/null 2>&1; then
            pgrep -P "$PID" | xargs -r kill -KILL 2>/dev/null || true
        fi
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

# Function to stop by port (fallback method)
stop_by_port() {
    local PORT=$1
    local NAME=$2
    
    local PID=""
    
    # Try lsof first (works on macOS and Linux)
    if command -v lsof >/dev/null 2>&1; then
        PID=$(lsof -ti:$PORT 2>/dev/null | head -1)
    # Fallback to netstat/sockstat on some systems
    elif command -v netstat >/dev/null 2>&1; then
        PID=$(netstat -tlnp 2>/dev/null | grep ":$PORT " | awk '{print $7}' | cut -d'/' -f1 | head -1)
    fi
    
    if [ -n "$PID" ] && [ "$PID" != "-" ]; then
        echo -e "${GREEN}Found $NAME process on port $PORT (PID: $PID), stopping...${NC}"
        kill_process_tree "$PID" "$NAME"
        sleep 2
        if kill -0 "$PID" 2>/dev/null; then
            kill -KILL "$PID" 2>/dev/null || true
            sleep 1
        fi
        echo -e "${GREEN}$NAME on port $PORT stopped${NC}"
    fi
}

# Stop in reverse dependency order
echo -e "${GREEN}Stopping frontend...${NC}"
stop_by_pid_file "$PROJECT_ROOT/.frontend.pid" "Frontend"
# Fallback: stop by port (Vite default port 5173)
stop_by_port 5173 "Frontend"

echo -e "${GREEN}Stopping backend...${NC}"
stop_by_pid_file "$PROJECT_ROOT/.backend.pid" "Backend"
# Fallback: stop by port (backend default port 3001)
stop_by_port 3001 "Backend"

echo -e "${GREEN}Stopping Ganache...${NC}"
stop_by_pid_file "$PROJECT_ROOT/.ganache.pid" "Ganache"
# Fallback: stop by port (Ganache default port 8545)
stop_by_port 8545 "Ganache"

echo -e "${GREEN}All services stopped${NC}"
