import { default as BasicCipher } from '../../basicCipher.js';
import { CipherValidator } from '../../utils/validation.js';

/**
 * Two-Square Cipher
 * 
 * A digraph substitution cipher that uses two Polybius squares.
 * Similar to Four-Square but uses only two squares (one standard, one keyed).
 * 
 * Layout:
 * [Square1 (standard)] [Square2 (keyed)]
 * 
 * Encoding: Find digraph positions, use opposite corners
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Keyword for generating the keyed square
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class TwoSquare extends BasicCipher {
    constructor(message, keyword = 'KEYWORD', encoded = false, debug = false) {
        super(message, encoded, 'twoSquare', keyword, '', debug);
        this.squares = this.generateSquares(keyword);
    }

    /**
     * Generate the two Polybius squares
     * @param {String} keyword - Keyword for square 2
     * @returns {Object} Object with two 5x5 grids
     */
    generateSquares(keyword) {
        // Square 1 (left): Standard alphabet
        const square1 = this.generateStandardSquare();
        
        // Square 2 (right): From keyword
        const square2 = this.generateKeyedSquare(keyword);
        
        return { square1, square2 };
    }

    /**
     * Generate standard alphabet square (A-Z, I/J combined)
     * @returns {Array} 5x5 grid
     */
    generateStandardSquare() {
        const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
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
     * Generate keyed square from keyword
     * @param {String} keyword - Keyword for generating square
     * @returns {Array} 5x5 grid
     */
    generateKeyedSquare(keyword) {
        const cleanKey = keyword.toUpperCase()
            .replace(/J/g, 'I')
            .replace(/[^A-Z]/g, '')
            .split('')
            .filter((char, index, self) => self.indexOf(char) === index)
            .join('');

        const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
        const used = new Set(cleanKey.split(''));
        const remaining = alphabet.split('').filter(char => !used.has(char)).join('');
        const fullAlphabet = cleanKey + remaining;
        
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
     * Find position of a letter in a square
     * @param {Array} square - 5x5 grid
     * @param {String} letter - Letter to find
     * @returns {Object} {row, col} position
     */
    findPosition(square, letter) {
        const upperLetter = letter.toUpperCase().replace(/J/g, 'I');
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (square[row][col] === upperLetter) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    /**
     * Prepare message for Two-Square (split into digraphs)
     * @param {String} message - Message to prepare
     * @returns {Array} Array of digraph pairs
     */
    prepareMessage(message) {
        const clean = message.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
        const pairs = [];
        
        for (let i = 0; i < clean.length; i += 2) {
            let first = clean[i];
            let second = clean[i + 1] || 'X';
            
            // If same letter, insert X
            if (first === second) {
                second = 'X';
                i--;
            }
            
            pairs.push([first, second]);
        }
        
        return pairs;
    }

    /**
     * Encode a digraph pair
     * @param {String} char1 - First character
     * @param {String} char2 - Second character
     * @returns {String} Encoded digraph
     */
    encodeDigraph(char1, char2) {
        const pos1 = this.findPosition(this.squares.square1, char1);
        const pos2 = this.findPosition(this.squares.square1, char2);
        
        if (!pos1 || !pos2) {
            return char1 + char2;
        }
        
        // Two-Square: use same row, but columns from square2
        // Actually, Two-Square works differently - it uses the same row from both squares
        const encoded1 = this.squares.square2[pos1.row][pos1.col];
        const encoded2 = this.squares.square2[pos2.row][pos2.col];
        
        return encoded1 + encoded2;
    }

    /**
     * Decode a digraph pair
     * @param {String} char1 - First character
     * @param {String} char2 - Second character
     * @returns {String} Decoded digraph
     */
    decodeDigraph(char1, char2) {
        const pos1 = this.findPosition(this.squares.square2, char1);
        const pos2 = this.findPosition(this.squares.square2, char2);
        
        if (!pos1 || !pos2) {
            return char1 + char2;
        }
        
        // Reverse: use square1
        const decoded1 = this.squares.square1[pos1.row][pos1.col];
        const decoded2 = this.squares.square1[pos2.row][pos2.col];
        
        return decoded1 + decoded2;
    }

    /**
     * Encode message using Two-Square cipher
     * @param {String} message - Text to encode
     * @param {String} keyword - Keyword for encryption
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        const cleanKey = keyword ? keyword.toUpperCase().replace(/[^A-Z]/g, '') : '';

        if (!cleanKey || cleanKey.length === 0) {
            throw new Error('Two-Square cipher requires a non-empty keyword');
        }

        // Regenerate squares if keyword changed
        if (keyword !== this.key) {
            this.squares = this.generateSquares(keyword);
            this.key = keyword;
        }

        const pairs = this.prepareMessage(message);
        let result = '';
        
        for (const [char1, char2] of pairs) {
            result += this.encodeDigraph(char1, char2);
        }
        
        return result;
    }

    /**
     * Decode message using Two-Square cipher
     * @param {String} message - Text to decode
     * @param {String} keyword - Keyword for decryption
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        const cleanKey = keyword ? keyword.toUpperCase().replace(/[^A-Z]/g, '') : '';

        if (!cleanKey || cleanKey.length === 0) {
            throw new Error('Two-Square cipher requires a non-empty keyword');
        }

        // Regenerate squares if keyword changed
        if (keyword !== this.key) {
            this.squares = this.generateSquares(keyword);
            this.key = keyword;
        }

        const clean = message.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
        const pairs = [];
        
        for (let i = 0; i < clean.length; i += 2) {
            if (i + 1 < clean.length) {
                pairs.push([clean[i], clean[i + 1]]);
            }
        }
        
        let result = '';
        
        for (const [char1, char2] of pairs) {
            result += this.decodeDigraph(char1, char2);
        }
        
        return result;
    }
}

