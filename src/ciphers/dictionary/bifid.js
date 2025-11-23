import { default as BasicCipher } from '../../core/basicCipher.js';
import { CipherValidator } from '../../core/validation.js';

/**
 * Bifid Cipher
 * 
 * A cipher that combines Polybius Square substitution with fractionated transposition.
 * It uses a Polybius Square to convert letters to coordinates, then transposes them.
 * 
 * Process:
 * 1. Convert each letter to row/column coordinates using Polybius Square
 * 2. Write coordinates in two rows (row numbers, then column numbers)
 * 3. Read coordinates in columns (transposition)
 * 4. Convert coordinate pairs back to letters using Polybius Square
 * 
 * Example:
 * Plaintext: HELLO
 * Keyword:   KEYWORD (optional)
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Optional keyword for Polybius Square
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class Bifid extends BasicCipher {
    constructor(message, keyword = '', encoded = false, debug = false) {
        super(message, encoded, 'bifid', keyword, '', debug);
        this.grid = this.generateGrid(keyword);
    }

    /**
     * Generate the 5x5 Polybius grid (same as Polybius cipher)
     * @param {String} keyword - Optional keyword to scramble the grid
     * @returns {Array} 5x5 grid array
     */
    generateGrid(keyword = '') {
        let alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // I and J combined

        if (keyword) {
            const cleanKey = keyword.toUpperCase()
                .replace(/J/g, 'I')
                .split('')
                .filter((char, index, self) =>
                    /[A-Z]/.test(char) && self.indexOf(char) === index
                )
                .join('');

            const remaining = alphabet.split('')
                .filter(char => !cleanKey.includes(char))
                .join('');

            alphabet = cleanKey + remaining;
        }

        const grid = [];
        for (let i = 0; i < 5; i++) {
            grid[i] = [];
            for (let j = 0; j < 5; j++) {
                grid[i][j] = alphabet[i * 5 + j];
            }
        }

        return grid;
    }

    /**
     * Find position of a letter in the grid
     * @param {String} letter - Letter to find
     * @returns {Object} {row, col} position (0-indexed)
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
     * Get letter from grid position
     * @param {Number} row - Row index (0-4)
     * @param {Number} col - Column index (0-4)
     * @returns {String} Letter at position
     */
    getLetter(row, col) {
        if (row >= 0 && row < 5 && col >= 0 && col < 5) {
            return this.grid[row][col];
        }
        return '';
    }

    /**
     * Encode message using Bifid cipher
     * @param {String} message - Text to encode
     * @param {String} keyword - Optional keyword
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);

        // Regenerate grid if keyword changed
        if (keyword !== this.key) {
            this.grid = this.generateGrid(keyword);
            this.key = keyword;
        }

        const cleanMessage = message.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
        
        if (cleanMessage.length === 0) {
            return '';
        }

        // Step 1: Convert letters to coordinates (row, col pairs)
        const rows = [];
        const cols = [];
        for (const char of cleanMessage) {
            const pos = this.findPosition(char);
            if (pos) {
                rows.push(pos.row);
                cols.push(pos.col);
            }
        }

        // Step 2: Combine rows and cols into single sequence
        const combined = rows.concat(cols);

        // Step 3: Read in pairs (transposition)
        let result = '';
        for (let i = 0; i < combined.length - 1; i += 2) {
            const row = combined[i];
            const col = combined[i + 1];
            result += this.getLetter(row, col);
        }

        return result;
    }

    /**
     * Decode message using Bifid cipher
     * @param {String} message - Encoded text
     * @param {String} keyword - Optional keyword
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);

        // Regenerate grid if keyword changed
        if (keyword !== this.key) {
            this.grid = this.generateGrid(keyword);
            this.key = keyword;
        }

        const cleanMessage = message.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
        
        if (cleanMessage.length === 0) {
            return '';
        }

        // Step 1: Convert letters to coordinates (row, col pairs)
        const allNumbers = [];
        for (const char of cleanMessage) {
            const pos = this.findPosition(char);
            if (pos) {
                allNumbers.push(pos.row);
                allNumbers.push(pos.col);
            }
        }

        // Step 2: Split into two halves (reverse of encoding)
        const midPoint = Math.ceil(allNumbers.length / 2);
        const rows = allNumbers.slice(0, midPoint);
        const cols = allNumbers.slice(midPoint);

        // Step 3: Interleave rows and cols (reverse transposition)
        let result = '';
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const col = cols[i] !== undefined ? cols[i] : 0;
            result += this.getLetter(row, col);
        }

        return result;
    }
}

