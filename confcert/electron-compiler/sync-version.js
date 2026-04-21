// Script to sync package.json version from version.js
const fs = require('fs');
const path = require('path');

// Load version from version.js
const versionModule = require('./version.js');
const APP_VERSION = versionModule.APP_VERSION;

// Read package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Update version
packageJson.version = APP_VERSION;

// Write back to package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log(`✅ Updated package.json version to ${APP_VERSION}`);
