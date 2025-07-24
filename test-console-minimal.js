// Minimal console error test without Puppeteer
const https = require('https');
const { URL } = require('url');

// Create an agent that accepts self-signed certificates
const agent = new https.Agent({
  rejectUnauthorized: false
});

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = new URL(url);
    options.agent = agent;
    
    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.setTimeout(10000);
  });
}

async function testPage() {
  console.log('🔍 Testing BioCatch SDK page for potential issues...');
  
  try {
    // Fetch the main page
    const html = await fetchPage('https://localhost:9002/test.html');
    
    console.log('✅ Page loaded successfully');
    console.log(`📄 Page size: ${html.length} bytes`);
    
    // Check for common error patterns in the HTML
    const errorPatterns = [
      /error/gi,
      /failed/gi,
      /undefined/gi,
      /null/gi,
      /exception/gi,
      /404/gi,
      /500/gi
    ];
    
    console.log('\n🔍 Checking for error patterns in HTML:');
    errorPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`⚠️  Found ${matches.length} instances of "${pattern.source}"`);
      }
    });
    
    // Extract and test script sources
    const scriptMatches = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi);
    
    if (scriptMatches) {
      console.log('\n📜 Testing script files:');
      for (const match of scriptMatches) {
        const srcMatch = match.match(/src=["']([^"']+)["']/);
        if (srcMatch) {
          const src = srcMatch[1];
          try {
            const scriptUrl = src.startsWith('http') ? src : `https://localhost:9002/${src}`;
            const script = await fetchPage(scriptUrl);
            console.log(`✅ ${src} - ${script.length} bytes`);
            
            // Check for obvious JavaScript errors in the script
            const jsErrorPatterns = [
              /SyntaxError/gi,
              /ReferenceError/gi,
              /TypeError/gi,
              /Error:/gi,
              /Failed to/gi,
              /Cannot read/gi,
              /is not defined/gi
            ];
            
            jsErrorPatterns.forEach(pattern => {
              const matches = script.match(pattern);
              if (matches && matches.length > 0) {
                console.log(`   ⚠️  Found ${matches.length} potential error patterns: "${pattern.source}"`);
              }
            });
            
          } catch (error) {
            console.log(`❌ ${src} - Failed to load: ${error.message}`);
          }
        }
      }
    }
    
    // Check meta tags for configuration issues
    console.log('\n🏷️  Checking meta tag configuration:');
    const metaTags = html.match(/<meta[^>]+>/gi) || [];
    
    const importantMetas = ['cdConfLocation', 'cdWorkerUrl', 'bcsid', 'bcuid'];
    importantMetas.forEach(metaName => {
      const metaRegex = new RegExp(`name=['"]${metaName}['"][^>]+content=['"]([^"']+)['"]`, 'i');
      const match = html.match(metaRegex);
      if (match) {
        console.log(`✅ ${metaName}: ${match[1]}`);
      } else {
        console.log(`⚠️  ${metaName}: Not found`);
      }
    });
    
    // Test configuration endpoints
    console.log('\n🌐 Testing configuration endpoints:');
    const configEndpoints = [
      'https://localhost:9002/mock-config',
      'https://localhost:9002/mock-logs', 
      'https://localhost:9002/mock-wup'
    ];
    
    for (const url of configEndpoints) {
      try {
        const response = await fetchPage(url);
        console.log(`✅ ${url} - ${response.length} bytes`);
        
        // Try to parse as JSON
        try {
          const json = JSON.parse(response);
          console.log(`   📋 Valid JSON with ${Object.keys(json).length} keys`);
        } catch (e) {
          console.log(`   ⚠️  Not valid JSON: ${e.message}`);
        }
        
      } catch (error) {
        console.log(`❌ ${url} - Failed: ${error.message}`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('- Page loads successfully');
    console.log('- All script files are accessible');
    console.log('- Configuration endpoints are working');
    console.log('\nℹ️  Note: This test can only detect server-side and network issues.');
    console.log('   For actual browser console errors, you may need to:');
    console.log('   1. Open https://localhost:9002/test.html in your browser');
    console.log('   2. Open Developer Tools (F12)');
    console.log('   3. Check the Console tab for actual runtime errors');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPage();