
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"


if [ ! -d "$NVM_DIR" ]; then
    echo "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi


echo "Installing Node.js 22..."
nvm install 22
nvm use 22
nvm alias default 22

echo "✓ Node.js 22 installed and set as default"
echo ""


cd "$(dirname "$0")/../.."


echo "Installing npm packages..."
npm install


if [ $? -eq 0 ]; then
    echo "✓ Installation completed successfully!"


    echo ""
    echo "Installing global packages..."
    npm install -g vite
    npm install -g @yahal-even-chen/mcp-uploader

    if [ $? -eq 0 ]; then
        echo "✓ Global packages installed successfully!"
    else
        echo "⚠ Warning: Some global packages installation failed (may require sudo)"
    fi


    echo ""
    echo "Running mcp login..."
    mcp login

    if [ $? -eq 0 ]; then
        echo "✓ mcp login completed successfully!"
    else
        echo "⚠ Warning: mcp login failed"
    fi

    echo ""
    echo "All tasks completed! This window will close in 3 seconds..."
    sleep 3
    osascript -e 'tell application "Terminal" to close first window' & exit
else
    echo "✗ Installation failed!"
    read -p "Press any key to exit..."
    exit 1
fi
