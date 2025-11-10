#!/bin/bash

# Load nvm if it exists
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Navigate to the project root directory (FRONT folder)
cd "$(dirname "$0")/../.."

# Function to check if port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Start from default Vite port
PORT=5173

echo "Starting development server..."
echo ""

# Find available port
while check_port $PORT; do
    echo "⚠ Port $PORT is already in use"
    PORT=$((PORT + 1))
done

echo "✓ Using port $PORT"
echo ""
echo "=========================================="
echo "🚀 Development Server Starting..."
echo "=========================================="
echo ""
echo "📱 Local:   http://localhost:$PORT"
echo "🌐 Network: http://$(ipconfig getifaddr en0 2>/dev/null || echo "N/A"):$PORT"
echo ""
echo "=========================================="
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo ""

# Run dev server with the available port
PORT=$PORT npm run dev

# Keep terminal open if server crashes
if [ $? -ne 0 ]; then
    echo ""
    echo "✗ Development server failed to start!"
    echo ""
    read -p "Press any key to exit..."
fi
