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

        try {
            chain.forEach((step, index) => {
                const cipher = step.config.create(currentText, step.params);
                currentText = step.config.encode(cipher);
                steps.push(`Step ${index + 1} (${step.config.name}): ${currentText}`);
            });

            result.textContent = currentText;
            outputLength.textContent = currentText.length;

        } catch (error) {
            result.textContent = `Error: ${error.message}`;
        }
    }

    // Reverse chain and decrypt
    function reverseAndDecrypt() {
        if (chain.length === 0) {
            result.textContent = 'No ciphers in the chain!';
            return;
        }

        let currentText = result.textContent;
        if (currentText.startsWith('Error') || currentText === 'Execute the chain to see the encrypted result...') {
            alert('Please execute the chain first!');
            return;
        }

        try {
            // Reverse the chain and decrypt
            for (let i = chain.length - 1; i >= 0; i--) {
                const step = chain[i];
                const cipher = step.config.create(currentText, step.params);
                currentText = step.config.decode(cipher);
            }

            result.textContent = `Decrypted: ${currentText}`;

        } catch (error) {
            result.textContent = `Decryption Error: ${error.message}`;
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
