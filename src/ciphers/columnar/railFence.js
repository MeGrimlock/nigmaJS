import { default as BasicCipher } from '../../core/basicCipher.js';
import { CipherValidator } from '../../core/validation.js';

/**
 * Rail Fence Cipher
 * 
 * A transposition cipher that writes the plaintext in a zigzag pattern
 * along a number of "rails" (rows), then reads off the ciphertext row by row.
 * 
 * Example with 3 rails:
 * Plaintext: HELLO WORLD
 * 
 * H . . . O . . . R . .
 * . E . L .   . O . L D
 * . . L . . W . . . . .
 * 
 * Reading row by row: HOR EL OLDL L W
 * Ciphertext: HORELOLDLW
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {Number} rails - Number of rails (rows) to use (default: 3)
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class RailFence extends BasicCipher {
    constructor(message, rails = 3, encoded = false, debug = false) {
        super(message, encoded, 'railFence', rails, '', debug);
        this.rails = rails || 3;
    }

    /**
     * Encode message using Rail Fence cipher
     * @param {String} message - Text to encode
     * @param {Number} rails - Number of rails
     * @returns {String} Encoded message
     */
    encode = (message = this.message, rails = this.rails) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(rails, 'number');

        if (rails < 2) {
            throw new Error('Rail Fence cipher requires at least 2 rails');
        }

        const cleanMessage = message.toUpperCase().replace(/[^A-Z]/g, '');
        
        if (cleanMessage.length === 0) {
            return '';
        }

        // Create rails (arrays for each row)
        const fence = [];
        for (let i = 0; i < rails; i++) {
            fence[i] = [];
        }

        // Fill the fence in zigzag pattern
        let row = 0;
        let direction = 1; // 1 = down, -1 = up

        for (let i = 0; i < cleanMessage.length; i++) {
            fence[row].push(cleanMessage[i]);

            // Change direction at top or bottom
            if (row === 0) {
                direction = 1;
            } else if (row === rails - 1) {
                direction = -1;
            }

            row += direction;
        }

        // Read row by row
        let result = '';
        for (let i = 0; i < rails; i++) {
            result += fence[i].join('');
        }

        return result;
    }

    /**
     * Decode message using Rail Fence cipher
     * @param {String} message - Text to decode
     * @param {Number} rails - Number of rails
     * @returns {String} Decoded message
     */
    decode = (message = this.message, rails = this.rails) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(rails, 'number');

        if (rails < 2) {
            throw new Error('Rail Fence cipher requires at least 2 rails');
        }

        const cleanMessage = message.toUpperCase().replace(/[^A-Z]/g, '');
        
        if (cleanMessage.length === 0) {
            return '';
        }

        // Calculate how many characters go in each rail
        const fence = [];
        for (let i = 0; i < rails; i++) {
            fence[i] = [];
        }

        // Simulate the zigzag pattern to determine positions
        const positions = [];
        let row = 0;
        let direction = 1;

        for (let i = 0; i < cleanMessage.length; i++) {
            positions.push({ index: i, row });

            if (row === 0) {
                direction = 1;
            } else if (row === rails - 1) {
                direction = -1;
            }

            row += direction;
        }

        // Count characters per rail
        const railCounts = new Array(rails).fill(0);
        positions.forEach(pos => {
            railCounts[pos.row]++;
        });

        // Distribute ciphertext characters to rails
        let charIndex = 0;
        for (let r = 0; r < rails; r++) {
            for (let i = 0; i < railCounts[r]; i++) {
                if (charIndex < cleanMessage.length) {
                    fence[r].push(cleanMessage[charIndex]);
                    charIndex++;
                }
            }
        }

        // Read in zigzag pattern
        const railIndices = new Array(rails).fill(0);
        let result = '';
        row = 0;
        direction = 1;

        for (let i = 0; i < cleanMessage.length; i++) {
            result += fence[row][railIndices[row]];
            railIndices[row]++;

            if (row === 0) {
                direction = 1;
            } else if (row === rails - 1) {
                direction = -1;
            }

            row += direction;
        }

        return result;
    }
}

