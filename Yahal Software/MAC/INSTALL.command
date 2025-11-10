
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"


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
    echo "Running mcp auth..."
    mcp auth

    if [ $? -eq 0 ]; then
        echo "✓ mcp auth completed successfully!"

        echo ""
        echo "Running mcp login..."
        mcp login

        if [ $? -eq 0 ]; then
            echo "✓ mcp login completed successfully!"
        else
            echo "⚠ Warning: mcp login failed"
        fi
    else
        echo "⚠ Warning: mcp auth failed"
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
