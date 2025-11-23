import { default as BasicCipher } from '../../core/basicCipher.js';
import { CipherValidator } from '../../core/validation.js';

/**
 * Four-Square Cipher
 * 
 * A digraph substitution cipher that uses four Polybius squares arranged in a 2x2 grid.
 * The top-left and bottom-right squares contain the standard alphabet.
 * The top-right and bottom-left squares are generated from keywords.
 * 
 * Layout:
 * [Square1] [Square2]
 * [Square3] [Square4]
 * 
 * Encoding: Find digraph in Square1 and Square4, use opposite corners from Square2 and Square3
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword1 - Keyword for top-right square
 * @param {String} keyword2 - Keyword for bottom-left square
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class FourSquare extends BasicCipher {
    constructor(message, keyword1 = 'EXAMPLE', keyword2 = 'KEYWORD', encoded = false, debug = false) {
        super(message, encoded, 'fourSquare', keyword1, '', debug);
        this.keyword1 = keyword1;
        this.keyword2 = keyword2;
        this.squares = this.generateSquares(keyword1, keyword2);
    }

    /**
     * Generate the four Polybius squares
     * @param {String} keyword1 - Keyword for square 2 (top-right)
     * @param {String} keyword2 - Keyword for square 3 (bottom-left)
     * @returns {Object} Object with four 5x5 grids
     */
    generateSquares(keyword1, keyword2) {
        // Square 1 (top-left): Standard alphabet
        const square1 = this.generateStandardSquare();
        
        // Square 2 (top-right): From keyword1
        const square2 = this.generateKeyedSquare(keyword1);
        
        // Square 3 (bottom-left): From keyword2
        const square3 = this.generateKeyedSquare(keyword2);
        
        // Square 4 (bottom-right): Standard alphabet
        const square4 = this.generateStandardSquare();
        
        return { square1, square2, square3, square4 };
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
     * Prepare message for Four-Square (split into digraphs)
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
        const pos2 = this.findPosition(this.squares.square4, char2);
        
        if (!pos1 || !pos2) {
            return char1 + char2;
        }
        
        // Use opposite corners: square2[row1][col2] and square3[row2][col1]
        const encoded1 = this.squares.square2[pos1.row][pos2.col];
        const encoded2 = this.squares.square3[pos2.row][pos1.col];
        
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
        const pos2 = this.findPosition(this.squares.square3, char2);
        
        if (!pos1 || !pos2) {
            return char1 + char2;
        }
        
        // Reverse: use square1 and square4
        const decoded1 = this.squares.square1[pos1.row][pos2.col];
        const decoded2 = this.squares.square4[pos2.row][pos1.col];
        
        return decoded1 + decoded2;
    }

    /**
     * Encode message using Four-Square cipher
     * @param {String} message - Text to encode
     * @param {String} keyword1 - Keyword for square 2
     * @param {String} keyword2 - Keyword for square 3
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword1 = this.keyword1, keyword2 = this.keyword2) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword1, 'string');
        CipherValidator.validateKey(keyword2, 'string');

        const cleanKey1 = keyword1 ? keyword1.toUpperCase().replace(/[^A-Z]/g, '') : '';
        const cleanKey2 = keyword2 ? keyword2.toUpperCase().replace(/[^A-Z]/g, '') : '';

        if (!cleanKey1 || cleanKey1.length === 0 || !cleanKey2 || cleanKey2.length === 0) {
            throw new Error('Four-Square cipher requires two non-empty keywords');
        }

        // Regenerate squares if keywords changed
        if (keyword1 !== this.keyword1 || keyword2 !== this.keyword2) {
            this.squares = this.generateSquares(keyword1, keyword2);
            this.keyword1 = keyword1;
            this.keyword2 = keyword2;
        }

        const pairs = this.prepareMessage(message);
        let result = '';
        
        for (const [char1, char2] of pairs) {
            result += this.encodeDigraph(char1, char2);
        }
        
        return result;
    }

    /**
     * Decode message using Four-Square cipher
     * @param {String} message - Text to decode
     * @param {String} keyword1 - Keyword for square 2
     * @param {String} keyword2 - Keyword for square 3
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword1 = this.keyword1, keyword2 = this.keyword2) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword1, 'string');
        CipherValidator.validateKey(keyword2, 'string');

        const cleanKey1 = keyword1 ? keyword1.toUpperCase().replace(/[^A-Z]/g, '') : '';
        const cleanKey2 = keyword2 ? keyword2.toUpperCase().replace(/[^A-Z]/g, '') : '';

        if (!cleanKey1 || cleanKey1.length === 0 || !cleanKey2 || cleanKey2.length === 0) {
            throw new Error('Four-Square cipher requires two non-empty keywords');
        }

        // Regenerate squares if keywords changed
        if (keyword1 !== this.keyword1 || keyword2 !== this.keyword2) {
            this.squares = this.generateSquares(keyword1, keyword2);
            this.keyword1 = keyword1;
            this.keyword2 = keyword2;
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

