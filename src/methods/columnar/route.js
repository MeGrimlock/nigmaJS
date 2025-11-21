import { default as BasicCipher } from '../../basicCipher.js';
import { CipherValidator } from '../../utils/validation.js';

/**
 * Route Cipher
 * 
 * A transposition cipher that writes the message in a grid and reads it
 * following a specific route pattern (spiral, zigzag, etc.).
 * 
 * Common routes:
 * - Spiral: Start at top-left, go right, down, left, up, repeat
 * - Zigzag: Read row by row, alternating direction
 * - Column: Read column by column
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {Number} rows - Number of rows in the grid
 * @param {Number} cols - Number of columns in the grid
 * @param {String} route - Route pattern: 'spiral', 'zigzag', 'column' (default: 'spiral')
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class Route extends BasicCipher {
    constructor(message, rows = 5, cols = 5, route = 'spiral', encoded = false, debug = false) {
        super(message, encoded, 'route', rows, '', debug);
        this.rows = rows || 5;
        this.cols = cols || 5;
        this.route = route || 'spiral';
    }

    /**
     * Create grid from message
     * @param {String} message - Message to put in grid
     * @returns {Array} 2D grid array
     */
    createGrid(message) {
        const clean = message.toUpperCase().replace(/[^A-Z]/g, '');
        const grid = [];
        
        for (let r = 0; r < this.rows; r++) {
            grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const index = r * this.cols + c;
                grid[r][c] = index < clean.length ? clean[index] : 'X';
            }
        }
        
        return grid;
    }

    /**
     * Read grid following spiral route (clockwise from top-left)
     * @param {Array} grid - 2D grid array
     * @returns {String} Read message
     */
    readSpiral(grid) {
        let result = '';
        let top = 0, bottom = this.rows - 1;
        let left = 0, right = this.cols - 1;
        
        while (top <= bottom && left <= right) {
            // Right
            for (let c = left; c <= right; c++) {
                result += grid[top][c];
            }
            top++;
            
            // Down
            for (let r = top; r <= bottom; r++) {
                result += grid[r][right];
            }
            right--;
            
            // Left (if still valid)
            if (top <= bottom) {
                for (let c = right; c >= left; c--) {
                    result += grid[bottom][c];
                }
                bottom--;
            }
            
            // Up (if still valid)
            if (left <= right) {
                for (let r = bottom; r >= top; r--) {
                    result += grid[r][left];
                }
                left++;
            }
        }
        
        return result;
    }

    /**
     * Write to grid following spiral route (reverse of read)
     * @param {String} message - Message to write
     * @returns {Array} 2D grid array
     */
    writeSpiral(message) {
        const grid = [];
        for (let r = 0; r < this.rows; r++) {
            grid[r] = new Array(this.cols).fill('X');
        }
        
        let index = 0;
        let top = 0, bottom = this.rows - 1;
        let left = 0, right = this.cols - 1;
        
        while (top <= bottom && left <= right && index < message.length) {
            // Right
            for (let c = left; c <= right && index < message.length; c++) {
                grid[top][c] = message[index++];
            }
            top++;
            
            // Down
            for (let r = top; r <= bottom && index < message.length; r++) {
                grid[r][right] = message[index++];
            }
            right--;
            
            // Left
            if (top <= bottom) {
                for (let c = right; c >= left && index < message.length; c--) {
                    grid[bottom][c] = message[index++];
                }
                bottom--;
            }
            
            // Up
            if (left <= right) {
                for (let r = bottom; r >= top && index < message.length; r--) {
                    grid[r][left] = message[index++];
                }
                left++;
            }
        }
        
        return grid;
    }

    /**
     * Read grid row by row (zigzag: alternate direction)
     * @param {Array} grid - 2D grid array
     * @returns {String} Read message
     */
    readZigzag(grid) {
        let result = '';
        
        for (let r = 0; r < this.rows; r++) {
            if (r % 2 === 0) {
                // Left to right
                for (let c = 0; c < this.cols; c++) {
                    result += grid[r][c];
                }
            } else {
                // Right to left
                for (let c = this.cols - 1; c >= 0; c--) {
                    result += grid[r][c];
                }
            }
        }
        
        return result;
    }

    /**
     * Write to grid row by row (zigzag: alternate direction)
     * @param {String} message - Message to write
     * @returns {Array} 2D grid array
     */
    writeZigzag(message) {
        const grid = [];
        for (let r = 0; r < this.rows; r++) {
            grid[r] = new Array(this.cols).fill('X');
        }
        
        let index = 0;
        
        for (let r = 0; r < this.rows && index < message.length; r++) {
            if (r % 2 === 0) {
                // Left to right
                for (let c = 0; c < this.cols && index < message.length; c++) {
                    grid[r][c] = message[index++];
                }
            } else {
                // Right to left
                for (let c = this.cols - 1; c >= 0 && index < message.length; c--) {
                    grid[r][c] = message[index++];
                }
            }
        }
        
        return grid;
    }

    /**
     * Read grid column by column
     * @param {Array} grid - 2D grid array
     * @returns {String} Read message
     */
    readColumn(grid) {
        let result = '';
        
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows; r++) {
                result += grid[r][c];
            }
        }
        
        return result;
    }

    /**
     * Write to grid column by column
     * @param {String} message - Message to write
     * @returns {Array} 2D grid array
     */
    writeColumn(message) {
        const grid = [];
        for (let r = 0; r < this.rows; r++) {
            grid[r] = new Array(this.cols).fill('X');
        }
        
        let index = 0;
        
        for (let c = 0; c < this.cols && index < message.length; c++) {
            for (let r = 0; r < this.rows && index < message.length; r++) {
                grid[r][c] = message[index++];
            }
        }
        
        return grid;
    }

    /**
     * Read grid following specified route
     * @param {Array} grid - 2D grid array
     * @returns {String} Read message
     */
    readGrid(grid) {
        switch (this.route.toLowerCase()) {
            case 'spiral':
                return this.readSpiral(grid);
            case 'zigzag':
                return this.readZigzag(grid);
            case 'column':
                return this.readColumn(grid);
            default:
                return this.readSpiral(grid);
        }
    }

    /**
     * Write to grid following specified route
     * @param {String} message - Message to write
     * @returns {Array} 2D grid array
     */
    writeGrid(message) {
        switch (this.route.toLowerCase()) {
            case 'spiral':
                return this.writeSpiral(message);
            case 'zigzag':
                return this.writeZigzag(message);
            case 'column':
                return this.writeColumn(message);
            default:
                return this.writeSpiral(message);
        }
    }

    /**
     * Encode message using Route cipher
     * @param {String} message - Text to encode
     * @param {Number} rows - Number of rows
     * @param {Number} cols - Number of columns
     * @param {String} route - Route pattern
     * @returns {String} Encoded message
     */
    encode = (message = this.message, rows = this.rows, cols = this.cols, route = this.route) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(rows, 'number');
        CipherValidator.validateKey(cols, 'number');

        if (rows < 2 || cols < 2) {
            throw new Error('Route cipher requires at least 2 rows and 2 columns');
        }

        this.rows = rows;
        this.cols = cols;
        this.route = route || 'spiral';

        const grid = this.createGrid(message);
        return this.readGrid(grid);
    }

    /**
     * Decode message using Route cipher
     * @param {String} message - Text to decode
     * @param {Number} rows - Number of rows
     * @param {Number} cols - Number of columns
     * @param {String} route - Route pattern
     * @returns {String} Decoded message
     */
    decode = (message = this.message, rows = this.rows, cols = this.cols, route = this.route) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(rows, 'number');
        CipherValidator.validateKey(cols, 'number');

        if (rows < 2 || cols < 2) {
            throw new Error('Route cipher requires at least 2 rows and 2 columns');
        }

        this.rows = rows;
        this.cols = cols;
        this.route = route || 'spiral';

        const clean = message.toUpperCase().replace(/[^A-Z]/g, '');
        const grid = this.writeGrid(clean);
        
        // Read row by row to get original message
        let result = '';
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                result += grid[r][c];
            }
        }
        
        // Remove padding X's
        return result.replace(/X+$/, '');
    }
}

