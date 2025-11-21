// Cipher Chain Builder Logic
document.addEventListener('DOMContentLoaded', () => {
    const plaintext = document.getElementById('plaintext');
    const chainContainer = document.getElementById('chainContainer');
    const executeBtn = document.getElementById('executeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const reverseBtn = document.getElementById('reverseBtn');
    const result = document.getElementById('result');
    const stepCount = document.getElementById('stepCount');
    const inputLength = document.getElementById('inputLength');
    const outputLength = document.getElementById('outputLength');

    let chain = [];

    // Cipher configurations
    const cipherConfigs = {
        caesar: {
            name: 'Caesar Shift',
            params: [{ name: 'shift', label: 'Shift', type: 'number', default: 3 }],
            create: (text, params) => new window.nigmajs.Shift.CaesarShift(text, parseInt(params.shift, 10)),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        atbash: {
            name: 'Atbash',
            params: [],
            create: (text) => new window.nigmajs.Dictionary.Atbash(text),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        morse: {
            name: 'Morse Code',
            params: [],
            create: (text) => new window.nigmajs.Dictionary.Morse(text),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        rot13: {
            name: 'ROT13',
            params: [],
            create: (text) => new window.nigmajs.Shift.Rot13(text, 13),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        rot5: {
            name: 'ROT5',
            params: [],
            create: (text) => new window.nigmajs.Shift.Rot5(text),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        rot18: {
            name: 'ROT18',
            params: [],
            create: (text) => new window.nigmajs.Shift.Rot18(text),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        rot47: {
            name: 'ROT47',
            params: [],
            create: (text) => new window.nigmajs.Shift.Rot47(text),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        amsco: {
            name: 'AMSCO',
            params: [{ name: 'key', label: 'Key', type: 'text', default: '132' }],
            create: (text, params) => new window.nigmajs.Columnar.Amsco(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        autokey: {
            name: 'Autokey',
            params: [{ name: 'key', label: 'Key', type: 'text', default: 'SECRET' }],
            create: (text, params) => new window.nigmajs.Dictionary.Autokey(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        baconian: {
            name: 'Baconian',
            params: [],
            create: (text) => new window.nigmajs.Dictionary.Baconian(text),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        simpleSub: {
            name: 'Simple Substitution',
            params: [{ name: 'key', label: 'Key', type: 'text', default: 'ZYXWVUTSRQPONMLKJIHGFEDCBA' }],
            create: (text, params) => new window.nigmajs.Dictionary.SimpleSubstitution(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        enigma: {
            name: 'Enigma',
            params: [
                { name: 'rotors', label: 'Rotors', type: 'text', default: '123' },
                { name: 'ring', label: 'Ring', type: 'text', default: 'AAA' },
                { name: 'key', label: 'Key', type: 'text', default: 'AAA' },
                { name: 'plugs', label: 'Plugs', type: 'text', default: 'PO ML IU KJ NH YT GB VF RE DC' }
            ],
            create: (text, params) => new window.nigmajs.Enigma(text, params.key, params.ring, params.plugs, params.rotors),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.encode() // Enigma is reciprocal
        },
        vigenere: {
            name: 'Vigenère',
            params: [{ name: 'key', label: 'Keyword', type: 'text', default: 'KEY' }],
            create: (text, params) => new window.nigmajs.Polyalphabetic.Vigenere(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        polybius: {
            name: 'Polybius Square',
            params: [{ name: 'key', label: 'Keyword (optional)', type: 'text', default: '' }],
            create: (text, params) => new window.nigmajs.Dictionary.Polybius(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        quagmire1: {
            name: 'Quagmire I',
            params: [{ name: 'key', label: 'Keyword', type: 'text', default: 'KEY' }],
            create: (text, params) => new window.nigmajs.Polyalphabetic.Quagmire1(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        quagmire2: {
            name: 'Quagmire II',
            params: [
                { name: 'key', label: 'Keyword', type: 'text', default: 'KEY' },
                { name: 'indicator', label: 'Indicator', type: 'text', default: 'A' }
            ],
            create: (text, params) => new window.nigmajs.Polyalphabetic.Quagmire2(text, params.key, params.indicator),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        quagmire3: {
            name: 'Quagmire III',
            params: [
                { name: 'key', label: 'Keyword', type: 'text', default: 'KEY' },
                { name: 'indicator', label: 'Indicator', type: 'text', default: 'A' }
            ],
            create: (text, params) => new window.nigmajs.Polyalphabetic.Quagmire3(text, params.key, params.indicator),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        quagmire4: {
            name: 'Quagmire IV',
            params: [
                { name: 'key', label: 'Keyword', type: 'text', default: 'KEY' },
                { name: 'indicator', label: 'Indicator', type: 'text', default: 'ABC' }
            ],
            create: (text, params) => new window.nigmajs.Polyalphabetic.Quagmire4(text, params.key, params.indicator),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        beaufort: {
            name: 'Beaufort',
            params: [{ name: 'key', label: 'Keyword', type: 'text', default: 'KEY' }],
            create: (text, params) => new window.nigmajs.Polyalphabetic.Beaufort(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        porta: {
            name: 'Porta',
            params: [{ name: 'key', label: 'Keyword', type: 'text', default: 'KEY' }],
            create: (text, params) => new window.nigmajs.Polyalphabetic.Porta(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        gronsfeld: {
            name: 'Gronsfeld',
            params: [{ name: 'key', label: 'Numeric Key', type: 'text', default: '12345' }],
            create: (text, params) => new window.nigmajs.Polyalphabetic.Gronsfeld(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        bifid: {
            name: 'Bifid',
            params: [{ name: 'key', label: 'Keyword (optional)', type: 'text', default: '' }],
            create: (text, params) => new window.nigmajs.Dictionary.Bifid(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        }
    };

    // Add cipher to chain
    function addCipherToChain(cipherType) {
        const config = cipherConfigs[cipherType];
        const params = {};

        config.params.forEach(param => {
            params[param.name] = param.default;
        });

        chain.push({
            type: cipherType,
            config: config,
            params: params
        });

        renderChain();
        updateStats();
    }

    // Remove cipher from chain
    function removeCipherFromChain(index) {
        chain.splice(index, 1);
        renderChain();
        updateStats();
    }

    // Move cipher up in chain
    function moveCipherUp(index) {
        if (index > 0) {
            [chain[index - 1], chain[index]] = [chain[index], chain[index - 1]];
            renderChain();
        }
    }

    // Move cipher down in chain
    function moveCipherDown(index) {
        if (index < chain.length - 1) {
            [chain[index], chain[index + 1]] = [chain[index + 1], chain[index]];
            renderChain();
        }
    }

    // Update parameter
    function updateParameter(index, paramName, value) {
        chain[index].params[paramName] = value;
    }

    // Render chain
    function renderChain() {
        if (chain.length === 0) {
            chainContainer.innerHTML = '<div class="chain-empty">Click a cipher to add it to the chain</div>';
            return;
        }

        let html = '';
        chain.forEach((step, index) => {
            html += `
                <div class="chain-step">
                    <div class="step-header">
                        <div class="step-number">${index + 1}</div>
                        <div class="step-name">${step.config.name}</div>
                        <div class="step-controls">
                            ${index > 0 ? '<button class="step-btn" onclick="moveCipherUp(' + index + ')">↑</button>' : ''}
                            ${index < chain.length - 1 ? '<button class="step-btn" onclick="moveCipherDown(' + index + ')">↓</button>' : ''}
                            <button class="step-btn remove" onclick="removeCipherFromChain(${index})">✕</button>
                        </div>
                    </div>
                    ${step.config.params.length > 0 ? `
                        <div class="step-params">
                            ${step.config.params.map(param => `
                                <div class="param-group">
                                    <label>${param.label}:</label>
                                    <input 
                                        type="${param.type}" 
                                        value="${step.params[param.name]}"
                                        onchange="updateParameter(${index}, '${param.name}', this.value)"
                                    />
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                ${index < chain.length - 1 ? '<div class="arrow-down">↓</div>' : ''}
            `;
        });

        chainContainer.innerHTML = html;
    }

    // Execute chain
    function executeChain() {
        if (chain.length === 0) {
            result.textContent = 'No ciphers in the chain!';
            return;
        }

        let currentText = plaintext.value;
        const steps = [];
        let stepsHTML = '<div style="margin-bottom: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 0.5rem; border-left: 3px solid #8b5cf6;">';
        stepsHTML += '<strong style="color: #8b5cf6;">🔍 Intermediate Steps:</strong><br><br>';
        stepsHTML += `<div style="color: #94a3b8; margin: 0.5rem 0;">Input: <span style="color: #10b981;">${currentText}</span></div>`;

        try {
            chain.forEach((step, index) => {
                const cipher = step.config.create(currentText, step.params);
                const previousText = currentText;
                currentText = step.config.encode(cipher);
                steps.push(currentText);

                stepsHTML += `<div style="margin: 0.5rem 0; padding-left: 1rem; border-left: 2px solid #334155;">`;
                stepsHTML += `<div style="color: #8b5cf6;">Step ${index + 1}: ${step.config.name}</div>`;
                stepsHTML += `<div style="color: #e2e8f0; font-family: 'Fira Code', monospace; font-size: 0.9rem;">${currentText}</div>`;
                stepsHTML += `</div>`;
            });

            stepsHTML += '</div>';

            // Store steps for decryption
            window.encryptionSteps = steps;
            window.encryptedResult = currentText;

            result.innerHTML = stepsHTML + `<div style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 0.5rem;">
                <strong style="color: #10b981;">✨ Final Result:</strong><br>
                <div style="margin-top: 0.5rem; font-family: 'Fira Code', monospace; color: #10b981; word-break: break-all;">${currentText}</div>
            </div>`;

            outputLength.textContent = currentText.length;

        } catch (error) {
            result.innerHTML = `<div style="color: #ef4444; padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 0.5rem;">
                <strong>❌ Error:</strong> ${error.message}
            </div>`;
        }
    }

    // Reverse chain and decrypt
    function reverseAndDecrypt() {
        if (chain.length === 0) {
            result.textContent = 'No ciphers in the chain!';
            return;
        }

        if (!window.encryptedResult) {
            alert('Please execute the chain first!');
            return;
        }

        let currentText = window.encryptedResult;
        let stepsHTML = '<div style="margin-bottom: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 0.5rem; border-left: 3px solid #f59e0b;">';
        stepsHTML += '<strong style="color: #f59e0b;">🔓 Decryption Steps (Reverse Order):</strong><br><br>';
        stepsHTML += `<div style="color: #94a3b8; margin: 0.5rem 0;">Encrypted: <span style="color: #f59e0b;">${currentText}</span></div>`;

        try {
            // Reverse the chain and decrypt
            for (let i = chain.length - 1; i >= 0; i--) {
                const step = chain[i];
                const cipher = step.config.create(currentText, step.params);
                currentText = step.config.decode(cipher);

                stepsHTML += `<div style="margin: 0.5rem 0; padding-left: 1rem; border-left: 2px solid #334155;">`;
                stepsHTML += `<div style="color: #f59e0b;">Step ${chain.length - i}: Reverse ${step.config.name}</div>`;
                stepsHTML += `<div style="color: #e2e8f0; font-family: 'Fira Code', monospace; font-size: 0.9rem;">${currentText}</div>`;
                stepsHTML += `</div>`;
            }

            stepsHTML += '</div>';

            const originalText = plaintext.value;
            const isMatch = currentText.trim().toLowerCase() === originalText.trim().toLowerCase();

            result.innerHTML = stepsHTML + `<div style="margin-top: 1rem; padding: 1rem; background: rgba(${isMatch ? '16, 185, 129' : '239, 68, 68'}, 0.1); border: 1px solid ${isMatch ? '#10b981' : '#ef4444'}; border-radius: 0.5rem;">
                <strong style="color: ${isMatch ? '#10b981' : '#ef4444'};">${isMatch ? '✅' : '⚠️'} Decrypted Result:</strong><br>
                <div style="margin-top: 0.5rem; font-family: 'Fira Code', monospace; color: ${isMatch ? '#10b981' : '#ef4444'}; word-break: break-all;">${currentText}</div>
                ${!isMatch ? `<div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 0.25rem; font-size: 0.9rem;">
                    <strong>⚠️ Warning:</strong> Decrypted text doesn't match original input!<br>
                    <strong>Original:</strong> ${originalText}<br>
                    <strong>Got:</strong> ${currentText}<br><br>
                    <em>This usually happens when chaining incompatible ciphers (e.g., Morse changes text format, making subsequent ciphers process symbols instead of letters).</em>
                </div>` : ''}
            </div>`;

        } catch (error) {
            result.innerHTML = `<div style="color: #ef4444; padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 0.5rem;">
                <strong>❌ Decryption Error:</strong> ${error.message}
            </div>`;
        }
    }

    // Clear chain
    function clearChain() {
        chain = [];
        renderChain();
        updateStats();
        result.textContent = 'Execute the chain to see the encrypted result...';
        outputLength.textContent = '0';
    }

    // Update stats
    function updateStats() {
        stepCount.textContent = chain.length;
        inputLength.textContent = plaintext.value.length;
    }

    // Event listeners
    document.querySelectorAll('.cipher-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addCipherToChain(btn.dataset.cipher);
        });
    });

    executeBtn.addEventListener('click', executeChain);
    clearBtn.addEventListener('click', clearChain);
    reverseBtn.addEventListener('click', reverseAndDecrypt);
    plaintext.addEventListener('input', updateStats);

    // Make functions global for onclick handlers
    window.removeCipherFromChain = removeCipherFromChain;
    window.moveCipherUp = moveCipherUp;
    window.moveCipherDown = moveCipherDown;
    window.updateParameter = updateParameter;

    // Initial stats
    updateStats();
});
