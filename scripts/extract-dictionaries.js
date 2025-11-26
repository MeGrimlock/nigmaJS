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

// 3. Extract Italian
console.log('Extracting Italian Dictionary...');
try {
    // Load words from italian-words-dict/dist/words.json
    // The file is an object where keys are words
    const italianWordsDict = require('italian-words-dict/dist/words.json');
    
    // Extract all word keys from the dictionary object
    const italianWords = Object.keys(italianWordsDict);
    
    // Normalize and uppercase words, remove accents
    const italianSet = italianWords
        .map(word => word.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase())
        .filter(word => word && word.length > 0 && /^[A-Z]+$/.test(word)) // Only letters, no empty
        .filter((word, index, self) => self.indexOf(word) === index); // Remove duplicates
    
    fs.writeFileSync(
        path.join(outputDir, 'italian-dictionary.json'), 
        JSON.stringify(italianSet)
    );
    console.log(`Saved ${italianSet.length} Italian words.`);
} catch (error) {
    console.error('❌ Failed to extract Italian dictionary:', error.message);
    console.log('💡 Make sure italian-words-dict is installed: npm install italian-words-dict');
}

console.log('✅ Dictionary extraction complete.');

