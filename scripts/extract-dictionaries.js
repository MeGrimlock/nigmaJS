const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const outputDir = path.join(__dirname, '../demo/data');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Extract English
console.log('Extracting English Dictionary...');
const englishWords = require('an-array-of-english-words');
const englishSet = englishWords.map(w => w.toUpperCase());
fs.writeFileSync(
    path.join(outputDir, 'english-dictionary.json'), 
    JSON.stringify(englishSet)
);
console.log(`Saved ${englishSet.length} English words.`);

// 2. Extract Spanish
console.log('Extracting Spanish Dictionary...');
const spanishWords = require('an-array-of-spanish-words');
const spanishSet = spanishWords.map(w => 
    w.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase()
);
fs.writeFileSync(
    path.join(outputDir, 'spanish-dictionary.json'), 
    JSON.stringify(spanishSet)
);
console.log(`Saved ${spanishSet.length} Spanish words.`);

console.log('✅ Dictionary extraction complete.');

