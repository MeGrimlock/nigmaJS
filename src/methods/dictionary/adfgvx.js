import { default as BasicCipher } from '../../basicCipher.js';
import { CipherValidator } from '../../utils/validation.js';

/**
 * ADFGVX Cipher
 * 
 * A cipher that combines Polybius Square substitution with columnar transposition.
 * Uses a 6x6 Polybius Square with coordinates A, D, F, G, V, X (allowing 36 characters).
 * First substitutes letters to ADFGVX pairs, then transposes columns.
 * 
 * Process:
 * 1. Convert each letter to ADFGVX coordinate pair using Polybius Square
 * 2. Write coordinates in rows based on transposition key
 * 3. Reorder columns according to key
 * 4. Read column by column
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Keyword for Polybius Square
 * @param {String} transpositionKey - Keyword for columnar transposition
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class ADFGVX extends BasicCipher {
    constructor(message, keyword = 'KEYWORD', transpositionKey = 'KEY', encoded = false, debug = false) {
        super(message, encoded, 'adfgvx', keyword, '', debug);
        this.transpositionKey = transpositionKey;
        this.grid = this.generateGrid(keyword);
        this.coordinates = 'ADFGVX';
    }

    /**
     * Generate the 6x6 Polybius grid (allows 36 characters: A-Z + 0-9)
     * @param {String} keyword - Keyword for generating grid
     * @returns {Array} 6x6 grid array
     */
    generateGrid(keyword = '') {
        // ADFGVX uses 36 characters: A-Z + 0-9
        let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        if (keyword) {
            const cleanKey = keyword.toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .split('')
                .filter((char, index, self) => self.indexOf(char) === index)
                .join('');

            const remaining = alphabet.split('')
                .filter(char => !cleanKey.includes(char))
                .join('');

            alphabet = cleanKey + remaining;
        }

        const grid = [];
        for (let i = 0; i < 6; i++) {
            grid[i] = [];
            for (let j = 0; j < 6; j++) {
                grid[i][j] = alphabet[i * 6 + j];
            }
        }

        return grid;
    }

    /**
     * Find position of a character in the grid
     * @param {String} char - Character to find
     * @returns {Object} {row, col} position
     */
    findPosition(char) {
        const upperChar = char.toUpperCase();

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                if (this.grid[row][col] === upperChar) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    /**
     * Get character from grid position
     * @param {Number} row - Row index (0-5)
     * @param {Number} col - Column index (0-5)
     * @returns {String} Character at position
     */
    getChar(row, col) {
        if (row >= 0 && row < 6 && col >= 0 && col < 6) {
            return this.grid[row][col];
        }
        return '';
    }

    /**
     * Get ADFGVX coordinate from row/col
     * @param {Number} index - Index (0-5)
     * @returns {String} ADFGVX coordinate
     */
    getCoordinate(index) {
        return this.coordinates[index];
    }

    /**
     * Get index from ADFGVX coordinate
     * @param {String} coord - ADFGVX coordinate
     * @returns {Number} Index (0-5)
     */
    getCoordinateIndex(coord) {
        return this.coordinates.indexOf(coord.toUpperCase());
    }

    /**
     * Sort key characters and return sorted indices
     * @param {String} key - Transposition key
     * @returns {Array} Array of indices in sorted order
     */
    getSortedKeyIndices(key) {
        const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
        const keyChars = cleanKey.split('');
        const sorted = [...keyChars].sort();
        
        return keyChars.map(char => sorted.indexOf(char));
    }

    /**
     * Encode message using ADFGVX cipher
     * @param {String} message - Text to encode
     * @param {String} keyword - Keyword for Polybius Square
     * @param {String} transpositionKey - Keyword for transposition
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword = this.key, transpositionKey = this.transpositionKey) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');
        CipherValidator.validateKey(transpositionKey, 'string');

        const cleanTransKey = transpositionKey ? transpositionKey.toUpperCase().replace(/[^A-Z]/g, '') : '';

        if (!cleanTransKey || cleanTransKey.length === 0) {
            throw new Error('ADFGVX cipher requires a non-empty transposition key');
        }

        // Regenerate grid if keyword changed
        if (keyword !== this.key) {
            this.grid = this.generateGrid(keyword);
            this.key = keyword;
        }
        this.transpositionKey = transpositionKey;

        const cleanMessage = message.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        if (cleanMessage.length === 0) {
            return '';
        }

        // Step 1: Convert to ADFGVX coordinates
        let coordinates = '';
        for (const char of cleanMessage) {
            const pos = this.findPosition(char);
            if (pos) {
                coordinates += this.getCoordinate(pos.row);
                coordinates += this.getCoordinate(pos.col);
            }
        }

        // Step 2: Write coordinates in rows based on transposition key length
        const keyLen = transpositionKey.toUpperCase().replace(/[^A-Z]/g, '').length;
        const rows = [];
        for (let i = 0; i < coordinates.length; i += keyLen) {
            rows.push(coordinates.slice(i, i + keyLen).split(''));
        }

        // Pad last row if needed
        if (rows.length > 0) {
            while (rows[rows.length - 1].length < keyLen) {
                rows[rows.length - 1].push('X');
            }
        }

        // Step 3: Reorder columns according to key
        const sortedIndices = this.getSortedKeyIndices(transpositionKey);
        const reordered = [];
        
        for (let col = 0; col < keyLen; col++) {
            const originalCol = sortedIndices.indexOf(col);
            for (let row = 0; row < rows.length; row++) {
                if (!reordered[row]) {
                    reordered[row] = [];
                }
                reordered[row][col] = rows[row][originalCol];
            }
        }

        // Step 4: Read column by column
        let result = '';
        for (let col = 0; col < keyLen; col++) {
            for (let row = 0; row < reordered.length; row++) {
                if (reordered[row] && reordered[row][col]) {
                    result += reordered[row][col];
                }
            }
        }

        return result;
    }

    /**
     * Decode message using ADFGVX cipher
     * @param {String} message - Text to decode
     * @param {String} keyword - Keyword for Polybius Square
     * @param {String} transpositionKey - Keyword for transposition
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword = this.key, transpositionKey = this.transpositionKey) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');
        CipherValidator.validateKey(transpositionKey, 'string');

        const cleanTransKey = transpositionKey ? transpositionKey.toUpperCase().replace(/[^A-Z]/g, '') : '';

        if (!cleanTransKey || cleanTransKey.length === 0) {
            throw new Error('ADFGVX cipher requires a non-empty transposition key');
        }

        // Regenerate grid if keyword changed
        if (keyword !== this.key) {
            this.grid = this.generateGrid(keyword);
            this.key = keyword;
        }
        this.transpositionKey = transpositionKey;

        const cleanMessage = message.toUpperCase().replace(/[^ADFGVX]/g, '');
        
        if (cleanMessage.length === 0) {
            return '';
        }

        // Step 1: Reverse columnar transposition
        const keyLen = transpositionKey.toUpperCase().replace(/[^A-Z]/g, '').length;
        const numRows = Math.ceil(cleanMessage.length / keyLen);
        
        // Read column by column into grid
        const grid = [];
        let msgIndex = 0;
        for (let col = 0; col < keyLen; col++) {
            for (let row = 0; row < numRows; row++) {
                if (!grid[row]) {
                    grid[row] = [];
                }
                if (msgIndex < cleanMessage.length) {
                    grid[row][col] = cleanMessage[msgIndex];
                    msgIndex++;
                }
            }
        }

        // Step 2: Reorder columns back
        const sortedIndices = this.getSortedKeyIndices(transpositionKey);
        const reordered = [];
        
        for (let col = 0; col < keyLen; col++) {
            const targetCol = sortedIndices[col];
            for (let row = 0; row < numRows; row++) {
                if (!reordered[row]) {
                    reordered[row] = [];
                }
                reordered[row][targetCol] = grid[row][col];
            }
        }

        // Step 3: Read row by row
        let coordinates = '';
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < keyLen; col++) {
                if (reordered[row] && reordered[row][col]) {
                    coordinates += reordered[row][col];
                }
            }
        }

        // Step 4: Convert ADFGVX pairs back to characters
        // Remove padding X's that might have been added
        let cleanCoords = coordinates.replace(/X+$/, '');
        
        let result = '';
        for (let i = 0; i < cleanCoords.length - 1; i += 2) {
            const rowCoord = cleanCoords[i];
            const colCoord = cleanCoords[i + 1];
            const row = this.getCoordinateIndex(rowCoord);
            const col = this.getCoordinateIndex(colCoord);
            
            if (row !== -1 && col !== -1) {
                result += this.getChar(row, col);
            }
        }

        return result;
    }
}

