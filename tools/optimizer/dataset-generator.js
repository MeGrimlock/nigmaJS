const fs = require('fs');
const path = require('path');
const englishWords = require('an-array-of-english-words');
const spanishWords = require('an-array-of-spanish-words');

class DatasetGenerator {
    constructor(language = 'english') {
        this.language = language;
        const wordList = language === 'spanish' ? spanishWords : englishWords;
        this.words = wordList.filter(w => w.length > 2 && /^[a-z]+$/i.test(w));
    }

    /**
     * Add realistic noise to text (typos, numbers, symbols)
     */
    addNoise(text, noiseLevel = 0.1) {
        const chars = text.split('');
        const noiseChars = '0123456789!@#$%&*()_+-=[]{}|;:,.<>?';

        for (let i = 0; i < chars.length; i++) {
            if (Math.random() < noiseLevel) {
                const action = Math.random();
                if (action < 0.3) {
                    // Delete character (typo)
                    chars[i] = '';
                } else if (action < 0.6) {
                    // Replace with random char (typo)
                    chars[i] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                } else {
                    // Insert noise character
                    chars[i] += noiseChars[Math.floor(Math.random() * noiseChars.length)];
                }
            }
        }

        return chars.join('');
    }

    getRandomText(minWords = 5, maxWords = 20) {
        const count = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
        const sentence = [];
        for (let i = 0; i < count; i++) {
            sentence.push(this.words[Math.floor(Math.random() * this.words.length)]);
        }
        return sentence.join(' ').toUpperCase();
    }

    // --- Cipher Implementations for Generation ---

    caesar(text, shift) {
        return text.replace(/[A-Z]/g, char => {
            const code = char.charCodeAt(0);
            return String.fromCharCode(((code - 65 + shift) % 26) + 65);
        });
    }

    vigenere(text, key) {
        let keyIndex = 0;
        const keyUpper = key.toUpperCase();
        return text.replace(/[A-Z]/g, char => {
            const shift = keyUpper.charCodeAt(keyIndex % keyUpper.length) - 65;
            keyIndex++;
            const code = char.charCodeAt(0);
            return String.fromCharCode(((code - 65 + shift) % 26) + 65);
        });
    }

    rot47(text) {
        const s = [];
        for (let i = 0; i < text.length; i++) {
            let j = text.charCodeAt(i);
            if ((j >= 33) && (j <= 126)) {
                s[i] = String.fromCharCode(33 + ((j + 14) % 94));
            } else {
                s[i] = String.fromCharCode(j);
            }
        }
        return s.join('');
    }

    // --- Generation Logic ---

    generateDataset(count = 100, options = {}) {
        const { addNoise = false, noiseLevel = 0.05 } = options;
        const dataset = [];
        const types = ['caesar', 'vigenere', 'rot47', 'plaintext'];

        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const plaintext = this.getRandomText(10, 50); // Medium length texts
            let ciphertext = plaintext;
            let key = null;

            switch (type) {
                case 'caesar':
                    key = Math.floor(Math.random() * 25) + 1; // 1-25
                    ciphertext = this.caesar(plaintext, key);
                    break;
                case 'vigenere':
                    const keyLen = Math.floor(Math.random() * 8) + 3; // 3-10 chars
                    key = this.getRandomText(1, 1).substring(0, keyLen).replace(/\s/g, ''); // Simple key gen
                    // Ensure key is valid letters
                    if (key.length < 3) key = "KEY";
                    ciphertext = this.vigenere(plaintext, key);
                    break;
                case 'rot47':
                    ciphertext = this.rot47(plaintext);
                    break;
                case 'plaintext':
                    // Keep as is
                    break;
            }

            // Apply noise if enabled
            if (addNoise && type !== 'plaintext') {
                ciphertext = this.addNoise(ciphertext, noiseLevel);
            }

            dataset.push({
                id: i,
                type,
                key,
                plaintext,
                ciphertext,
                language: this.language
            });
        }

        return dataset;
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new DatasetGenerator();
    const dataset = generator.generateDataset(50); // Generate 50 samples for testing
    const outputPath = path.join(__dirname, 'dataset.json');
    fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
    console.log(`Generated ${dataset.length} samples to ${outputPath}`);
}

module.exports = DatasetGenerator;
