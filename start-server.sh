#!/bin/bash

# Function to start the server
start_server() {
    echo "Starting Astro server..."
    npm run dev -- --port 4321 --host 0.0.0.0 &
    SERVER_PID=$!
    echo "Server started with PID: $SERVER_PID"
    return $SERVER_PID
}

# Function to check if server is running
check_server() {
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to test server response
test_server() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/api/test 2>/dev/null)
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Main monitoring loop
echo "Starting robust Astro server with monitoring..."
start_server

while true; do
    sleep 5
    
    if ! check_server; then
        echo "Server process died, restarting..."
        start_server
    elif ! test_server; then
        echo "Server not responding, restarting..."
        kill $SERVER_PID 2>/dev/null
        sleep 2
        start_server
    else
        echo "Server is running normally (PID: $SERVER_PID)"
    fi
done