#!/usr/bin/env node

/**
 * Simple test script for the MCP Git Status Server
 * This script simulates an MCP client calling our server tools
 */

import { execSync } from "child_process";
import { spawn } from "child_process";
import { writeFileSync, readFileSync } from "fs";

console.log("🧪 Testing MCP Git Status Server...\n");

async function testMCPServer() {
  try {
    // Test 1: Check if server starts
    console.log("1️⃣ Testing server startup...");
    const serverProcess = spawn("node", ["dist/index.js"], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let serverOutput = "";
    serverProcess.stderr.on("data", (data) => {
      serverOutput += data.toString();
    });

    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (serverOutput.includes("Git Status MCP Server started")) {
      console.log("✅ Server started successfully");
    } else {
      console.log("❌ Server failed to start");
      console.log("Output:", serverOutput);
    }

    // Test 2: Send tools/list request
    console.log("\n2️⃣ Testing tools/list request...");
    
    const listRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {}
    };

    serverProcess.stdin.write(JSON.stringify(listRequest) + "\n");

    let listResponse = "";
    const listPromise = new Promise((resolve) => {
      serverProcess.stdout.on("data", (data) => {
        listResponse += data.toString();
        if (listResponse.includes('"result"')) {
          resolve(listResponse);
        }
      });
    });

    await Promise.race([
      listPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
    ]);

    if (listResponse.includes("git-status") && listResponse.includes("git-log")) {
      console.log("✅ Tools list returned correctly");
      console.log("   - git-status tool found");
      console.log("   - git-log tool found");
    } else {
      console.log("❌ Tools list response invalid");
      console.log("Response:", listResponse);
    }

    // Test 3: Call git-status tool
    console.log("\n3️⃣ Testing git-status tool...");
    
    const statusRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "git-status",
        arguments: {}
      }
    };

    serverProcess.stdin.write(JSON.stringify(statusRequest) + "\n");

    let statusResponse = "";
    const statusPromise = new Promise((resolve) => {
      serverProcess.stdout.on("data", (data) => {
        const newData = data.toString();
        statusResponse += newData;
        if (newData.includes('"id":2') && newData.includes('"result"')) {
          resolve(statusResponse);
        }
      });
    });

    await Promise.race([
      statusPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
    ]);

    if (statusResponse.includes("Git Status for:") && statusResponse.includes("Current branch:")) {
      console.log("✅ git-status tool works correctly");
      console.log("   - Repository status retrieved");
      console.log("   - Branch information included");
    } else {
      console.log("❌ git-status tool response invalid");
      console.log("Response:", statusResponse);
    }

    // Clean up
    serverProcess.kill();
    
    console.log("\n🎉 MCP Server testing completed!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run tests
testMCPServer().catch(console.error);