#!/usr/bin/env node

/**
 * Console Capture Script for BioCatch SDK
 * Captures browser console messages from https://localhost:9002/test.html
 */

const fs = require('fs');
const path = require('path');

// Check if puppeteer is available
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (error) {
    console.log('📦 Installing Puppeteer...');
    require('child_process').execSync('npm install --save-dev puppeteer', { stdio: 'inherit' });
    puppeteer = require('puppeteer');
}

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    magenta: '\x1b[35m'
};

// Store all captured messages
const capturedMessages = [];

async function captureConsoleMessages() {
    console.log('🚀 Starting browser console capture...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        ignoreHTTPSErrors: true,
        args: [
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--allow-running-insecure-content',
            '--disable-web-security',
            '--no-sandbox',
            '--disable-features=VizDisplayCompositor'
        ]
    });

    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', async (msg) => {
        const type = msg.type();
        const text = msg.text();
        const location = msg.location();
        
        const message = {
            type,
            text,
            location,
            timestamp: new Date().toISOString()
        };
        
        capturedMessages.push(message);
        
        // Color-coded output
        let color = colors.reset;
        let prefix = '📝';
        
        switch (type) {
            case 'error':
                color = colors.red;
                prefix = '❌';
                break;
            case 'warning':
            case 'warn':
                color = colors.yellow;
                prefix = '⚠️';
                break;
            case 'info':
                color = colors.blue;
                prefix = 'ℹ️';
                break;
            case 'debug':
                color = colors.cyan;
                prefix = '🐛';
                break;
            default:
                color = colors.green;
                prefix = '📝';
        }
        
        console.log(`${color}${prefix} [${type.toUpperCase()}] ${text}${colors.reset}`);
        if (location.url && location.lineNumber) {
            console.log(`   📍 ${location.url}:${location.lineNumber}:${location.columnNumber || 0}`);
        }
    });
    
    // Capture page errors
    page.on('pageerror', (error) => {
        const message = {
            type: 'pageerror',
            text: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        
        capturedMessages.push(message);
        console.log(`${colors.red}💥 [PAGE ERROR] ${error.message}${colors.reset}`);
        if (error.stack) {
            console.log(`   📍 ${error.stack.split('\n')[1]?.trim() || 'Unknown location'}`);
        }
    });
    
    // Capture unhandled exceptions
    page.on('error', (error) => {
        const message = {
            type: 'exception',
            text: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        
        capturedMessages.push(message);
        console.log(`${colors.red}🔥 [EXCEPTION] ${error.message}${colors.reset}`);
    });
    
    // Capture network failures
    page.on('requestfailed', (request) => {
        const message = {
            type: 'network-error',
            text: `Failed to load: ${request.url()}`,
            error: request.failure()?.errorText,
            timestamp: new Date().toISOString()
        };
        
        capturedMessages.push(message);
        console.log(`${colors.magenta}🌐 [NETWORK ERROR] Failed to load: ${request.url()}${colors.reset}`);
        if (request.failure()?.errorText) {
            console.log(`   📍 Error: ${request.failure().errorText}`);
        }
    });
    
    try {
        console.log('🌐 Navigating to https://localhost:9002/test.html...');
        
        // Navigate to the page
        await page.goto('https://localhost:9002/test.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        console.log('⏳ Waiting for page to fully load and SDK to initialize...');
        
        // Wait for the page to fully load and SDK to initialize
        await page.waitForTimeout(5000);
        
        // Try to interact with the page to trigger more potential errors
        console.log('🖱️ Attempting to interact with SDK controls...');
        
        try {
            // Try clicking some buttons to trigger SDK functionality
            await page.evaluate(() => {
                // Try to call some SDK functions if available
                if (window.cdApi) {
                    console.log('✅ cdApi is available');
                    if (window.cdApi.client) {
                        console.log('✅ cdApi.client is available');
                    }
                } else {
                    console.log('❌ cdApi is not available');
                }
                
                if (window.BioCatchSDK) {
                    console.log('✅ BioCatchSDK is available');
                } else {
                    console.log('❌ BioCatchSDK is not available');
                }
            });
            
            // Wait a bit more for any async operations
            await page.waitForTimeout(2000);
            
        } catch (interactionError) {
            console.log(`${colors.yellow}⚠️ Could not interact with page elements: ${interactionError.message}${colors.reset}`);
        }
        
    } catch (error) {
        console.log(`${colors.red}❌ Failed to load page: ${error.message}${colors.reset}`);
    }
    
    await browser.close();
    
    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONSOLE CAPTURE SUMMARY');
    console.log('='.repeat(60));
    
    const summary = {
        total: capturedMessages.length,
        errors: capturedMessages.filter(m => m.type === 'error' || m.type === 'pageerror' || m.type === 'exception').length,
        warnings: capturedMessages.filter(m => m.type === 'warning' || m.type === 'warn').length,
        network: capturedMessages.filter(m => m.type === 'network-error').length,
        info: capturedMessages.filter(m => m.type === 'info' || m.type === 'log').length,
        other: capturedMessages.filter(m => !['error', 'pageerror', 'exception', 'warning', 'warn', 'network-error', 'info', 'log'].includes(m.type)).length
    };
    
    console.log(`📝 Total Messages: ${summary.total}`);
    console.log(`❌ Errors: ${summary.errors}`);
    console.log(`⚠️ Warnings: ${summary.warnings}`);
    console.log(`🌐 Network Errors: ${summary.network}`);
    console.log(`ℹ️ Info Messages: ${summary.info}`);
    console.log(`📄 Other: ${summary.other}`);
    
    // Save detailed results to file
    const outputFile = path.join(__dirname, 'console-capture.json');
    fs.writeFileSync(outputFile, JSON.stringify({
        summary,
        messages: capturedMessages,
        timestamp: new Date().toISOString(),
        url: 'https://localhost:9002/test.html'
    }, null, 2));
    
    console.log(`\n💾 Detailed results saved to: ${outputFile}`);
    
    if (summary.errors > 0) {
        console.log(`\n${colors.red}🚨 Found ${summary.errors} error(s) that need attention!${colors.reset}`);
        process.exit(1);
    } else if (summary.warnings > 0) {
        console.log(`\n${colors.yellow}⚠️ Found ${summary.warnings} warning(s) to review.${colors.reset}`);
    } else {
        console.log(`\n${colors.green}✅ No critical errors found!${colors.reset}`);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help')) {
    console.log(`
BioCatch SDK Console Capture Tool

Usage:
  node capture-console.js [options]

Options:
  --help    Show this help message

This tool will:
1. Launch a headless Chrome browser
2. Navigate to https://localhost:9002/test.html
3. Capture all console messages, errors, and warnings
4. Generate a summary report
5. Save detailed results to console-capture.json

Make sure your development server is running before using this tool:
  npm run devserver
`);
    process.exit(0);
}

// Run the capture
captureConsoleMessages().catch(error => {
    console.error(`${colors.red}❌ Script failed: ${error.message}${colors.reset}`);
    process.exit(1);
});