#!/usr/bin/env node

/**
 * MCP Server Validation Script
 * Tests the git status MCP server functionality and protocol compliance
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

class MCPValidator {
  constructor(serverPath) {
    this.serverPath = serverPath;
    this.serverProcess = null;
    this.messageId = 1;
  }

  async startServer() {
    console.log('🚀 Starting MCP server...');
    this.serverProcess = spawn('node', [this.serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Setup error handling
    this.serverProcess.stderr.on('data', (data) => {
      console.log('Server stderr:', data.toString());
    });

    this.serverProcess.on('error', (error) => {
      console.error('Server error:', error);
    });

    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      const messageStr = JSON.stringify(message) + '\n';
      
      let responseData = '';
      const onData = (data) => {
        responseData += data.toString();
        try {
          const response = JSON.parse(responseData.trim());
          this.serverProcess.stdout.removeListener('data', onData);
          resolve(response);
        } catch (e) {
          // Continue collecting data if JSON is incomplete
        }
      };

      this.serverProcess.stdout.on('data', onData);
      this.serverProcess.stdin.write(messageStr);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        this.serverProcess.stdout.removeListener('data', onData);
        reject(new Error('Timeout waiting for response'));
      }, 5000);
    });
  }

  async testInitialization() {
    console.log('🔧 Testing MCP initialization...');
    
    const initRequest = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'validator',
          version: '1.0.0'
        }
      }
    };

    try {
      const response = await this.sendMessage(initRequest);
      console.log('✅ Initialization successful');
      console.log('Server capabilities:', JSON.stringify(response.result?.capabilities, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      return false;
    }
  }

  async testToolsList() {
    console.log('🛠️  Testing tools/list...');
    
    const toolsRequest = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'tools/list',
      params: {}
    };

    try {
      const response = await this.sendMessage(toolsRequest);
      const tools = response.result?.tools || [];
      
      console.log('✅ Tools list successful');
      console.log(`Found ${tools.length} tools:`);
      tools.forEach(tool => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });

      // Verify expected tools exist
      const expectedTools = ['git-status', 'git-log'];
      const foundTools = tools.map(t => t.name);
      const missingTools = expectedTools.filter(t => !foundTools.includes(t));
      
      if (missingTools.length > 0) {
        console.error(`❌ Missing tools: ${missingTools.join(', ')}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Tools list failed:', error.message);
      return false;
    }
  }

  async testGitStatus() {
    console.log('📊 Testing git-status tool...');
    
    const gitStatusRequest = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'tools/call',
      params: {
        name: 'git-status',
        arguments: {}
      }
    };

    try {
      const response = await this.sendMessage(gitStatusRequest);
      const content = response.result?.content || [];
      
      console.log('✅ Git status successful');
      if (content.length > 0 && content[0].text) {
        console.log('Git status output preview:');
        console.log(content[0].text.substring(0, 200) + '...');
      }
      return true;
    } catch (error) {
      console.error('❌ Git status failed:', error.message);
      return false;
    }
  }

  async testGitLog() {
    console.log('📝 Testing git-log tool...');
    
    const gitLogRequest = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'tools/call',
      params: {
        name: 'git-log',
        arguments: {
          count: 5
        }
      }
    };

    try {
      const response = await this.sendMessage(gitLogRequest);
      const content = response.result?.content || [];
      
      console.log('✅ Git log successful');
      if (content.length > 0 && content[0].text) {
        console.log('Git log output preview:');
        console.log(content[0].text.substring(0, 200) + '...');
      }
      return true;
    } catch (error) {
      console.error('❌ Git log failed:', error.message);
      return false;
    }
  }

  async testErrorHandling() {
    console.log('🚨 Testing error handling...');
    
    const invalidToolRequest = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'tools/call',
      params: {
        name: 'nonexistent-tool',
        arguments: {}
      }
    };

    try {
      const response = await this.sendMessage(invalidToolRequest);
      
      if (response.error) {
        console.log('✅ Error handling working correctly');
        console.log('Error message:', response.error.message);
        return true;
      } else {
        console.error('❌ Server should have returned an error for invalid tool');
        return false;
      }
    } catch (error) {
      console.log('✅ Error handling working (exception caught)');
      return true;
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }

  async runAllTests() {
    console.log('🎯 MCP Git Status Server Validation');
    console.log('=====================================\n');

    let allPassed = true;

    try {
      await this.startServer();
      
      const tests = [
        () => this.testInitialization(),
        () => this.testToolsList(),
        () => this.testGitStatus(),
        () => this.testGitLog(),
        () => this.testErrorHandling()
      ];

      for (const test of tests) {
        const passed = await test();
        allPassed = allPassed && passed;
        console.log(''); // Add spacing between tests
      }

      console.log('=====================================');
      if (allPassed) {
        console.log('🎉 All tests passed! MCP server is working correctly.');
      } else {
        console.log('❌ Some tests failed. Please check the server implementation.');
      }

    } catch (error) {
      console.error('💥 Validation failed with error:', error);
      allPassed = false;
    } finally {
      await this.cleanup();
    }

    process.exit(allPassed ? 0 : 1);
  }
}

// Run validation
const serverPath = process.argv[2] || './dist/index.js';
const validator = new MCPValidator(serverPath);
validator.runAllTests();