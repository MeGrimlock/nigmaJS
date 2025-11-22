document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    const navHTML = `
    <nav class="nigma-navbar">
        <div class="nav-container">
            <a href="index.html" class="nav-brand">
                🔐 NigmaJS
            </a>
            <ul class="nav-links">
                <li class="nav-item">
                    <a href="index.html" class="${currentPath === 'index.html' ? 'active' : ''}">Home</a>
                </li>
                <li class="nav-item">
                    <a href="demo.html" class="${currentPath === 'demo.html' ? 'active' : ''}">Basic Ciphers</a>
                </li>
                <li class="nav-item">
                    <a href="chain-demo.html" class="${currentPath === 'chain-demo.html' ? 'active' : ''}">Cipher Chain</a>
                </li>
                <li class="nav-item">
                    <a href="language-guesser.html" class="${currentPath === 'language-guesser.html' ? 'active' : ''}">Lang Guesser</a>
                </li>
                <li class="nav-item">
                    <a href="decryption-tool.html" class="${currentPath === 'decryption-tool.html' ? 'active' : ''}">Decrypt Tool</a>
                </li>
                <li class="nav-item">
                    <a href="https://www.npmjs.com/package/nigmajs" target="_blank" class="github-link" style="background: #cb3837;">
                        NPM 📦
                    </a>
                </li>
                <li class="nav-item">
                    <a href="https://github.com/MeGrimlock/nigmaJS" target="_blank" class="github-link">
                        GitHub ↗
                    </a>
                </li>
            </ul>
        </div>
    </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', navHTML);
});

