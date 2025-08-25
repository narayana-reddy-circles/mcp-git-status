#!/bin/bash

# Setup script for MCP Git Status Server with Cursor IDE
echo "🚀 Setting up MCP Git Status Server for Cursor IDE..."

# Get the current directory
CURRENT_DIR=$(pwd)
DIST_PATH="$CURRENT_DIR/dist/index.js"

# Check if the server is built
if [ ! -f "$DIST_PATH" ]; then
    echo "📦 Building the MCP server..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Please check your installation."
        exit 1
    fi
fi

# Create Cursor configuration directory
echo "📁 Creating Cursor configuration directory..."
mkdir -p ~/.cursor
mkdir -p .cursor

# Create the MCP configuration
echo "⚙️  Creating Cursor MCP configuration..."

# Global configuration
cat > ~/.cursor/mcp.json << EOF
{
  "mcpServers": {
    "git-status": {
      "command": "node",
      "args": ["$DIST_PATH"],
      "description": "Git status and log tools for repository management",
      "env": {}
    }
  }
}
EOF

# Project-specific configuration
cat > .cursor/mcp.json << EOF
{
  "mcpServers": {
    "git-status": {
      "command": "node",
      "args": ["$DIST_PATH"],
      "description": "Git status and log tools for repository management",
      "env": {}
    }
  }
}
EOF

echo "✅ Configuration complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Restart Cursor IDE"
echo "2. In any chat, ask questions like:"
echo "   - 'What's the git status of this repository?'"
echo "   - 'Show me the last 5 commits'"
echo "   - 'Check if there are any uncommitted changes'"
echo ""
echo "🔧 Cursor will automatically use the git-status tools to answer your questions!"
echo ""
echo "📋 Configuration files created:"
echo "   - Global: ~/.cursor/mcp.json"
echo "   - Project: .cursor/mcp.json"
echo ""
echo "🚀 Happy coding with AI-powered git tools!"