import { default as BasicCipher } from '../../core/basicCipher.js';
import { CipherValidator } from '../../core/validation.js';

/**
 * Playfair Cipher
 * 
 * A digraph substitution cipher that encrypts pairs of letters (digraphs)
 * using a 5x5 grid constructed from a keyword. I and J are treated as the same letter.
 * 
 * Rules:
 * 1. If both letters are in the same row, replace each with the letter to its right
 * 2. If both letters are in the same column, replace each with the letter below it
 * 3. Otherwise, form a rectangle and replace with the opposite corners
 * 4. If letters are the same, insert X between them (or Q if XX)
 * 5. If odd length, add X at the end
 * 
 * Example:
 * Plaintext: HELLO
 * Keyword: KEYWORD
 * 
 * Grid:
 * K E Y W O
 * R D A B C
 * F G H I L
 * M N P Q S
 * T U V X Z
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Keyword for generating the grid
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class Playfair extends BasicCipher {
    constructor(message, keyword = 'KEYWORD', encoded = false, debug = false) {
        super(message, encoded, 'playfair', keyword, '', debug);
        this.grid = this.generateGrid(keyword);
    }

    /**
     * Generate the 5x5 Playfair grid from keyword
     * @param {String} keyword - Keyword for generating grid
     * @returns {Array} 5x5 grid array
     */
    generateGrid(keyword = 'KEYWORD') {
        const cleanKey = keyword.toUpperCase()
            .replace(/J/g, 'I')
            .replace(/[^A-Z]/g, '')
            .split('')
            .filter((char, index, self) => self.indexOf(char) === index)
            .join('');

        // Create alphabet (I and J combined)
        let alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
        const used = new Set(cleanKey.split(''));
        
        // Remove used letters from alphabet
        alphabet = alphabet.split('').filter(char => !used.has(char)).join('');
        
        const fullAlphabet = cleanKey + alphabet;
        const grid = [];
        
        for (let i = 0; i < 5; i++) {
            grid[i] = [];
            for (let j = 0; j < 5; j++) {
                grid[i][j] = fullAlphabet[i * 5 + j];
            }
        }
        
        return grid;
    }

    /**
     * Find position of a letter in the grid
     * @param {String} letter - Letter to find
     * @returns {Object} {row, col} position
     */
    findPosition(letter) {
        const upperLetter = letter.toUpperCase().replace(/J/g, 'I');
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (this.grid[row][col] === upperLetter) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    /**
     * Prepare message for Playfair (handle pairs, add X, etc.)
     * @param {String} message - Message to prepare
     * @returns {Array} Array of digraph pairs
     */
    prepareMessage(message) {
        const clean = message.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
        const pairs = [];
        
        for (let i = 0; i < clean.length; i += 2) {
            let first = clean[i];
            let second = clean[i + 1] || 'X';
            
            // If same letter, insert X (or Q if XX)
            if (first === second) {
                second = first === 'X' ? 'Q' : 'X';
                i--; // Back up one to process second letter again
            }
            
            pairs.push([first, second]);
        }
        
        return pairs;
    }

    /**
     * Encode a digraph pair
     * @param {String} char1 - First character
     * @param {String} char2 - Second character
     * @param {Number} direction - 1 for encode, -1 for decode
     * @returns {String} Encoded digraph
     */
    encodeDigraph(char1, char2, direction = 1) {
        const pos1 = this.findPosition(char1);
        const pos2 = this.findPosition(char2);
        
        if (!pos1 || !pos2) {
            return char1 + char2;
        }
        
        let newPos1, newPos2;
        
        // Same row
        if (pos1.row === pos2.row) {
            newPos1 = { row: pos1.row, col: (pos1.col + direction + 5) % 5 };
            newPos2 = { row: pos2.row, col: (pos2.col + direction + 5) % 5 };
        }
        // Same column
        else if (pos1.col === pos2.col) {
            newPos1 = { row: (pos1.row + direction + 5) % 5, col: pos1.col };
            newPos2 = { row: (pos2.row + direction + 5) % 5, col: pos2.col };
        }
        // Rectangle - opposite corners
        else {
            newPos1 = { row: pos1.row, col: pos2.col };
            newPos2 = { row: pos2.row, col: pos1.col };
        }
        
        return this.grid[newPos1.row][newPos1.col] + this.grid[newPos2.row][newPos2.col];
    }

    /**
     * Encode message using Playfair cipher
     * @param {String} message - Text to encode
     * @param {String} keyword - Keyword for encryption
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Playfair cipher requires a non-empty keyword');
        }

        // Regenerate grid if keyword changed
        if (keyword !== this.key) {
            this.grid = this.generateGrid(keyword);
            this.key = keyword;
        }

        const pairs = this.prepareMessage(message);
        let result = '';
        
        for (const [char1, char2] of pairs) {
            result += this.encodeDigraph(char1, char2, 1);
        }
        
        return result;
    }

    /**
     * Decode message using Playfair cipher
     * @param {String} message - Text to decode
     * @param {String} keyword - Keyword for decryption
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Playfair cipher requires a non-empty keyword');
        }

        // Regenerate grid if keyword changed
        if (keyword !== this.key) {
            this.grid = this.generateGrid(keyword);
            this.key = keyword;
        }

        const clean = message.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
        const pairs = [];
        
        // Split into digraphs
        for (let i = 0; i < clean.length; i += 2) {
            if (i + 1 < clean.length) {
                pairs.push([clean[i], clean[i + 1]]);
            }
        }
        
        let result = '';
        
        for (const [char1, char2] of pairs) {
            result += this.encodeDigraph(char1, char2, -1);
        }
        
        // Remove padding X's (but be careful - X might be part of original message)
        // For simplicity, we'll leave it as is since removing X's can be ambiguous
        
        return result;
    }
}

