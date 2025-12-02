document.addEventListener('DOMContentLoaded', () => {
    // Get version from nigmajs if available, otherwise show 'unknown'
    const getVersion = () => {
        // Try different ways to get version
        if (window.nigmajs && window.nigmajs.Nigma && window.nigmajs.Nigma.version) {
            return window.nigmajs.Nigma.version;
        }
        if (window.nigmajs && window.nigmajs.version) {
            return window.nigmajs.version;
        }
        // Check for webpack-defined version (injected during build)
        if (typeof NIGMAJS_VERSION !== 'undefined') {
            return NIGMAJS_VERSION;
        }
        if (window.NIGMAJS_VERSION) {
            return window.NIGMAJS_VERSION;
        }
        // Check if it's attached to window during runtime
        if (window.NIGMAJS_VERSION) {
            return window.NIGMAJS_VERSION;
        }
        // Try to get from package.json via script
        try {
            if (window.nigmajs && window.nigmajs.default && window.nigmajs.default.version) {
                return window.nigmajs.default.version;
            }
        } catch (e) {}

        // Try to get version from build process (injected during webpack build)
        try {
            // Check if version is available in the build
            if (window.nigmajs && window.nigmajs.VERSION) {
                return window.nigmajs.VERSION;
            }
        } catch (e) {}

        // Return current version from package.json
        return '3.1.89'; // Current version
    };

    const version = getVersion();
    const currentYear = new Date().getFullYear();

    const footerHTML = `
    <footer class="nigma-footer">
        <div class="footer-container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>🔐 NigmaJS</h4>
                    <p>A powerful JavaScript library for classical cipher encryption and decryption.</p>
                </div>
                <div class="footer-section">
                    <h4>Links</h4>
                    <ul class="footer-links">
                        <li><a href="index.html">Home</a></li>
                        <li><a href="demo.html">Basic Ciphers</a></li>
                        <li><a href="chain-demo.html">Cipher Chain</a></li>
                        <li><a href="language-guesser.html">Lang Guesser</a></li>
                        <li><a href="decryption-tool.html">Decrypt Tool</a></li>
                        <li><a href="cryptanalysis-tools.html">Cryptanalysis Tools</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Resources</h4>
                    <ul class="footer-links">
                        <li><a href="https://github.com/MeGrimlock/nigmaJS" target="_blank">GitHub ↗</a></li>
                        <li><a href="https://www.npmjs.com/package/nigmajs" target="_blank">NPM Package 📦</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <div class="footer-version">
                    <span class="version-label">Build Version:</span>
                    <span class="version-value">${version}</span>
                </div>
                <div class="footer-copyright">
                    <p>&copy; ${currentYear} NigmaJS. All rights reserved.</p>
                </div>
            </div>
        </div>
    </footer>
    `;

    document.body.insertAdjacentHTML('beforeend', footerHTML);
});

