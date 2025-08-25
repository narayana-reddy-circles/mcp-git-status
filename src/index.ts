#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execSync } from "child_process";
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema 
} from "@modelcontextprotocol/sdk/types.js";

/**
 * MCP Server that provides git status functionality
 * This server exposes tools that run git commands and return the output
 */

// Create an MCP server
const server = new Server({
  name: "git-status-server",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// Handle tools/list request - returns available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "git-status",
        description: "Get the current git status of the repository",
        inputSchema: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              description: "Directory path to check git status (defaults to current directory)"
            }
          }
        }
      },
      {
        name: "git-log",
        description: "Get recent git commit history",
        inputSchema: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              description: "Directory path to check git log (defaults to current directory)"
            },
            count: {
              type: "number",
              description: "Number of recent commits to show (default: 10)",
              default: 10
            }
          }
        }
      }
    ]
  };
});

// Handle tools/call request - executes the specified tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "git-status") {
    const { directory }: { directory?: string } = args || {};
    
    try {
      // Change to the specified directory if provided, otherwise use current directory
      const cwd = directory || process.cwd();
      
      // Execute git status command
      const gitStatus = execSync("git status --porcelain=v1", {
        cwd: cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"]
      });

      // Also get the branch information
      const gitBranch = execSync("git branch --show-current", {
        cwd: cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"]
      }).trim();

      // Get additional git info
      const gitRemote = execSync("git remote -v", {
        cwd: cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"]
      });

      // Format the response
      let statusText = `Git Status for: ${cwd}\n`;
      statusText += `Current branch: ${gitBranch}\n`;
      statusText += `\nStatus:\n`;
      
      if (gitStatus.trim() === "") {
        statusText += "Working directory clean - no changes detected\n";
      } else {
        statusText += gitStatus;
      }
      
      statusText += `\nRemotes:\n${gitRemote}`;

      return {
        content: [{
          type: "text",
          text: statusText
        }]
      };
      
    } catch (error) {
      // Handle errors (e.g., not a git repository, git not installed, etc.)
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        content: [{
          type: "text",
          text: `Error running git status: ${errorMessage}\n\nPlease ensure:\n1. You are in a git repository\n2. Git is installed and available in PATH\n3. You have proper permissions to access the directory`
        }],
        isError: true
      };
    }
  }
  
  if (name === "git-log") {
    const { directory, count = 10 }: { directory?: string; count?: number } = args || {};
    
    try {
      const cwd = directory || process.cwd();
      
      const gitLog = execSync(`git log --oneline -n ${count}`, {
        cwd: cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"]
      });

      return {
        content: [{
          type: "text",
          text: `Recent Git Commits (${count} most recent):\n\n${gitLog}`
        }]
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        content: [{
          type: "text",
          text: `Error running git log: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

/**
 * Start the server
 */
async function main() {
  // Create stdio transport for communication with MCP client
  const transport = new StdioServerTransport();
  
  // Connect the server to the transport
  await server.connect(transport);
  
  // Server is now running and will handle MCP protocol messages
  console.error("Git Status MCP Server started and listening on stdio");
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});