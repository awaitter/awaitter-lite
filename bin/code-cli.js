#!/usr/bin/env node

// Load .env from multiple possible locations
const path = require('path');
const fs = require('fs');

// Try to load .env from various locations
const envPaths = [
  path.join(process.cwd(), '.env'),                    // Current directory
  path.join(__dirname, '..', '..', '..', '.env'),      // LLM/.env
  path.join(require('os').homedir(), '.code-cli.env'), // Home directory
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    }
  }
}

require('../dist/index.js');
