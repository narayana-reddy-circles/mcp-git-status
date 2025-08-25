# MCP Git Status Server

A Model Context Protocol (MCP) server that provides git status and log functionality. This server allows MCP clients (like Claude Desktop, Cline, etc.) to check git repository status and view recent commit history.

## Features

- **Git Status Tool**: Get the current status of a git repository
- **Git Log Tool**: View recent commit history
- **Error Handling**: Graceful error handling for non-git directories and other issues
- **Directory Support**: Optionally specify a directory path to check

## Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

The server communicates via stdio (standard input/output) as per MCP protocol:

```bash
# Run the built version
npm start

# Or run in development mode with tsx
npm run dev
```

### Connecting to MCP Clients

#### Claude Desktop

Add this server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "git-status": {
      "command": "node",
      "args": ["/path/to/your/mcp-git-status-server/dist/index.js"]
    }
  }
}
```

#### Other MCP Clients

For other MCP clients, configure them to run this server as a subprocess with stdio transport.

## Available Tools

### git-status

Get the current git status of a repository.

**Parameters:**
- `directory` (optional): Directory path to check. Defaults to current directory.

**Example usage in MCP client:**
"Check the git status of my project"

### git-log  

View recent git commit history.

**Parameters:**
- `directory` (optional): Directory path to check. Defaults to current directory.
- `count` (optional): Number of recent commits to show. Defaults to 10.

**Example usage in MCP client:**
"Show me the last 5 git commits"

## Example Output

### Git Status (clean repository)
```
Git Status for: /Users/username/my-project
Current branch: main

Status:
Working directory clean - no changes detected

Remotes:
origin  https://github.com/username/my-project.git (fetch)
origin  https://github.com/username/my-project.git (push)
```

### Git Status (with changes)
```
Git Status for: /Users/username/my-project  
Current branch: feature-branch

Status:
M  src/index.ts
A  src/new-file.ts
?? untracked.txt

Remotes:
origin  https://github.com/username/my-project.git (fetch)
origin  https://github.com/username/my-project.git (push)
```

### Git Log
```
Recent Git Commits (5 most recent):

abc1234 Add new feature implementation
def5678 Fix bug in status handling  
ghi9012 Update documentation
jkl3456 Initial commit
```

## Error Handling

The server gracefully handles common error scenarios:

- **Not a git repository**: Provides clear error message
- **Git not installed**: Indicates git is not available
- **Permission issues**: Reports access problems
- **Invalid directory**: Handles non-existent paths

## Development

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Run in development mode with tsx
- `npm start`: Run the compiled server

### Project Structure

```
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Project configuration  
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Requirements

- Node.js 18.x or higher
- Git installed and available in PATH
- TypeScript (for development)

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

**Server not starting:**
- Check Node.js version (requires 18.x+)
- Ensure all dependencies are installed: `npm install`
- Build the project: `npm run build`

**Git commands failing:**
- Verify git is installed: `git --version`
- Ensure you're in a git repository
- Check file permissions

**MCP client not connecting:**
- Verify the path to the server executable in client configuration
- Check that the server process can be started manually
- Review client logs for connection errors