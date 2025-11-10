
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "$(dirname "$0")/../.."
echo "Running mcp deploy..."
echo "This may take a while, please wait..."
echo ""

mcp deploy


if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Deployment completed successfully!"
else
    echo ""
    echo "✗ Deployment failed!"
fi

echo ""
echo "Press any key to close this window..."
read -n 1 -s
exit
