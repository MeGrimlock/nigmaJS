import { default as BasicCipher } from '../../basicCipher.js';
import { CipherValidator } from '../../utils/validation.js';

/**
 * Polybius Square Cipher
 * 
 * The Polybius Square is a substitution cipher that translates letters into numbers 
 * using a 5x5 grid. Each letter is replaced by a pair of numbers corresponding to 
 * its row and column position in the square.
 * 
 * The 26 letters of the English alphabet are fit into the 25 cells by combining I and J.
 * 
 * Example grid (no keyword):
 *   1 2 3 4 5
 * 1 A B C D E
 * 2 F G H I K
 * 3 L M N O P
 * 4 Q R S T U
 * 5 V W X Y Z
 * 
 * "HELLO" would encode to: "23 15 31 31 34"
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Optional keyword to scramble the grid
 * @param {Boolean} encoded - Indicates if the message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class Polybius extends BasicCipher {
    constructor(message, keyword = '', encoded = false, debug = false) {
        super(message, encoded, 'polybius', keyword, '', debug);
        this.grid = this.generateGrid(keyword);
    }

    /**
     * Generate the 5x5 Polybius grid
     * @param {String} keyword - Optional keyword to scramble the grid
     * @returns {Array} 5x5 grid array
     */
    generateGrid(keyword = '') {
        let alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // I and J combined

        if (keyword) {
            // Remove duplicates and non-letters from keyword
            const cleanKey = keyword.toUpperCase()
                .replace(/J/g, 'I')
                .split('')
                .filter((char, index, self) =>
                    /[A-Z]/.test(char) && self.indexOf(char) === index
                )
                .join('');

            // Create alphabet with keyword first, then remaining letters
            const remaining = alphabet.split('')
                .filter(char => !cleanKey.includes(char))
                .join('');

            alphabet = cleanKey + remaining;
        }

        // Create 5x5 grid
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
     * @returns {Object} {row, col} position
     */
    findPosition(letter) {
        const upperLetter = letter.toUpperCase().replace(/J/g, 'I');

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (this.grid[row][col] === upperLetter) {
                    return { row: row + 1, col: col + 1 }; // 1-indexed
                }
            }
        }
        return null;
    }

    /**
     * Encode message using Polybius Square
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

        const cleanMessage = message.toUpperCase().replace(/[^A-Z]/g, '');
        let encoded = '';

        for (const char of cleanMessage) {
            const pos = this.findPosition(char);
            if (pos) {
                encoded += `${pos.row}${pos.col} `;
            }
        }

        return encoded.trim();
    }

    /**
     * Decode message using Polybius Square
     * @param {String} message - Encoded text (pairs of numbers)
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

        // Extract number pairs
        const pairs = message.match(/\d{2}/g) || [];
        let decoded = '';

        for (const pair of pairs) {
            const row = parseInt(pair[0]) - 1; // Convert to 0-indexed
            const col = parseInt(pair[1]) - 1;

            if (row >= 0 && row < 5 && col >= 0 && col < 5) {
                decoded += this.grid[row][col];
            }
        }

        return decoded;
    }
}
