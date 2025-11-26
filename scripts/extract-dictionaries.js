const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const outputDir = path.join(__dirname, '../demo/data');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Helper function to check if dictionary exists
function dictionaryExists(language) {
    const filePath = path.join(outputDir, `${language}-dictionary.json`);
    return fs.existsSync(filePath);
}

// 1. Extract English
const englishDictPath = path.join(outputDir, 'english-dictionary.json');
if (dictionaryExists('english')) {
    console.log('✓ English dictionary already exists, skipping...');
} else {
    console.log('Extracting English Dictionary...');
    const englishWords = require('an-array-of-english-words');
    const englishSet = englishWords.map(w => w.toUpperCase());
    fs.writeFileSync(englishDictPath, JSON.stringify(englishSet));
    console.log(`Saved ${englishSet.length} English words.`);
}

// 2. Extract Spanish
if (dictionaryExists('spanish')) {
    console.log('✓ Spanish dictionary already exists, skipping...');
} else {
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
}

// 3. Extract Italian
if (dictionaryExists('italian')) {
    console.log('✓ Italian dictionary already exists, skipping...');
} else {
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
}

// 4. Extract French
if (dictionaryExists('french')) {
    console.log('✓ French dictionary already exists, skipping...');
} else {
    console.log('Extracting French Dictionary...');
    try {
        const frenchWords = require('an-array-of-french-words');
        
        if (!Array.isArray(frenchWords)) {
            throw new Error('French words is not an array');
        }
        
        // Normalize and uppercase words, remove accents
        // Use Set for faster duplicate removal
        const frenchSet = new Set();
        for (const word of frenchWords) {
            if (typeof word === 'string' && word.length > 0) {
                const normalized = word.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
                if (/^[A-Z]+$/.test(normalized)) {
                    frenchSet.add(normalized);
                }
            }
        }
        const frenchArray = Array.from(frenchSet);
        
        fs.writeFileSync(
            path.join(outputDir, 'french-dictionary.json'), 
            JSON.stringify(frenchArray)
        );
        console.log(`Saved ${frenchArray.length} French words.`);
    } catch (error) {
        console.error('❌ Failed to extract French dictionary:', error.message);
        console.log('💡 Make sure an-array-of-french-words is installed: npm install an-array-of-french-words');
    }
}

// 5. Extract Portuguese
if (dictionaryExists('portuguese')) {
    console.log('✓ Portuguese dictionary already exists, skipping...');
} else {
    console.log('Extracting Portuguese Dictionary...');
    try {
        const portugueseWords = require('an-array-of-portuguese-words');
        
        if (!Array.isArray(portugueseWords)) {
            throw new Error('Portuguese words is not an array');
        }
        
        // Normalize and uppercase words, remove accents
        // Use Set for faster duplicate removal
        const portugueseSet = new Set();
        for (const word of portugueseWords) {
            if (typeof word === 'string' && word.length > 0) {
                const normalized = word.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
                if (/^[A-Z]+$/.test(normalized)) {
                    portugueseSet.add(normalized);
                }
            }
        }
        const portugueseArray = Array.from(portugueseSet);
        
        fs.writeFileSync(
            path.join(outputDir, 'portuguese-dictionary.json'), 
            JSON.stringify(portugueseArray)
        );
        console.log(`Saved ${portugueseArray.length} Portuguese words.`);
    } catch (error) {
        console.error('❌ Failed to extract Portuguese dictionary:', error.message);
        console.log('💡 Make sure an-array-of-portuguese-words is installed: npm install an-array-of-portuguese-words');
    }
}

// 6. Extract German
if (dictionaryExists('german')) {
    console.log('✓ German dictionary already exists, skipping...');
} else {
    console.log('Extracting German Dictionary...');
    try {
        // Load words from german-words-dict/dist/words.json
        // The file is an object where keys are words (similar to italian-words-dict)
        const germanWordsDict = require('german-words-dict/dist/words.json');
        
        // Extract all word keys from the dictionary object
        const germanWords = Object.keys(germanWordsDict);
        
        // Normalize and uppercase words, remove accents
        // Use Set for faster duplicate removal
        const germanSet = new Set();
        for (const word of germanWords) {
            if (typeof word === 'string' && word.length > 0) {
                const normalized = word.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
                if (/^[A-Z]+$/.test(normalized)) {
                    germanSet.add(normalized);
                }
            }
        }
        const germanArray = Array.from(germanSet);
        
        fs.writeFileSync(
            path.join(outputDir, 'german-dictionary.json'), 
            JSON.stringify(germanArray)
        );
        console.log(`Saved ${germanArray.length} German words.`);
    } catch (error) {
        console.error('❌ Failed to extract German dictionary:', error.message);
        console.log('💡 Make sure german-words-dict is installed: npm install german-words-dict');
    }
}

console.log('✅ Dictionary extraction complete.');

