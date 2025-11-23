/**
 * Text normalization and cleaning utilities.
 */
export const TextUtils = {
    /**
     * Normalizes text by removing accents and optionally stripping spaces/digits.
     * @param {string} text 
     * @param {Object} options 
     * @param {boolean} options.stripSpaces - Remove whitespace (default: true)
     * @param {boolean} options.keepDigits - Keep numbers (default: false)
     * @param {boolean} options.keepCase - Maintain original case (default: false)
     */
    normalize: (text, options = {}) => {
        const { stripSpaces = true, keepDigits = false, keepCase = false } = options;
        
        let result = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // Remove accents
        
        if (!keepCase) {
            result = result.toUpperCase();
        }

        let pattern;
        if (keepDigits) {
            // Keep A-Z and 0-9. If spaces allowed, keep them too.
            pattern = stripSpaces ? /[^A-Z0-9]/g : /[^A-Z0-9 ]/g;
        } else {
            // Keep A-Z only.
            pattern = stripSpaces ? /[^A-Z]/g : /[^A-Z ]/g;
        }

        // Case sensitive handling requires slightly different regex if keepCase is true
        // But usually for crypto we lowercase or uppercase. 
        // If keepCase is true, we adjust regex to allow a-z.
        if (keepCase) {
             if (keepDigits) {
                pattern = stripSpaces ? /[^a-zA-Z0-9]/g : /[^a-zA-Z0-9 ]/g;
            } else {
                pattern = stripSpaces ? /[^a-zA-Z]/g : /[^a-zA-Z ]/g;
            }
        }

        return result.replace(pattern, '');
    },

    /**
     * Returns only letters A-Z (uppercase).
     * @param {string} text 
     */
    onlyLetters: (text) => {
        return text.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, '');
    }
};

export default TextUtils;

