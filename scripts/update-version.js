const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Parse current version
const versionParts = packageJson.version.split('.');
const major = parseInt(versionParts[0], 10);
const minor = parseInt(versionParts[1], 10);
const patch = parseInt(versionParts[2], 10);

// Increment patch version (e.g., 3.1.0 -> 3.1.1)
const newVersion = `${major}.${minor}.${patch + 1}`;

// Update version
packageJson.version = newVersion;

// Write back to package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log(`✅ Version updated: ${packageJson.version} -> ${newVersion}`);

