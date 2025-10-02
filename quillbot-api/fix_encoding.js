// This script fixes the humanizer.js file encoding issues
const fs = require('fs');
const path = require('path');

// Read the current file
const filePath = path.join(__dirname, 'humanizer.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace problematic emoji characters with standard ones
content = content.replace(/\?O/g, '❌');
content = content.replace(/o\./g, '✅');
content = content.replace(/Y\"/g, '📸');
content = content.replace(/Y'/g, '🔒');
content = content.replace(/\?/g, '📊');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Successfully fixed encoding issues in humanizer.js');