// This script will fix all the encoding issues in the humanizer.js file
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'humanizer.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix common encoding replacements that could have happened
content = content.replace(/dY\"S/g, '?');  // Fix the ternary operator
content = content.replace(/\?S/g, '?');   // Another form of ternary operator
content = content.replace(/dY\"'/g, '''); // Fix quotes
content = content.replace(/dY\""/g, '"'); // Fix quotes

// More systematic replacement of problematic characters
content = content.replace(/\\?O/g, '❌'); // Error emoji
content = content.replace(/o\\./g, '✅'); // Success emoji
content = content.replace(/\\?O/g, '❌'); // Error emoji
content = content.replace(/o\\./g, '✅'); // Success emoji

// Write fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed common encoding issues in humanizer.js');