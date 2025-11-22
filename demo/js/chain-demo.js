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
    const languageSelect = document.getElementById('languageSelect');
    const modeEncryptBtn = document.getElementById('modeEncrypt');
    const modeDecryptBtn = document.getElementById('modeDecrypt');
    const pageSubtitle = document.getElementById('pageSubtitle');

    let chain = [];
    let currentMode = 'encrypt'; // 'encrypt' or 'decrypt'

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
        },
        railFence: {
            name: 'Rail Fence',
            params: [{ name: 'rails', label: 'Number of Rails', type: 'number', default: 3 }],
            create: (text, params) => new window.nigmajs.Columnar.RailFence(text, params.rails),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        playfair: {
            name: 'Playfair',
            params: [{ name: 'key', label: 'Keyword', type: 'text', default: 'KEYWORD' }],
            create: (text, params) => new window.nigmajs.Dictionary.Playfair(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        fourSquare: {
            name: 'Four-Square',
            params: [
                { name: 'key1', label: 'Keyword 1', type: 'text', default: 'EXAMPLE' },
                { name: 'key2', label: 'Keyword 2', type: 'text', default: 'KEYWORD' }
            ],
            create: (text, params) => new window.nigmajs.Dictionary.FourSquare(text, params.key1, params.key2),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        twoSquare: {
            name: 'Two-Square',
            params: [{ name: 'key', label: 'Keyword', type: 'text', default: 'KEYWORD' }],
            create: (text, params) => new window.nigmajs.Dictionary.TwoSquare(text, params.key),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        adfgvx: {
            name: 'ADFGVX',
            params: [
                { name: 'key', label: 'Keyword', type: 'text', default: 'KEYWORD' },
                { name: 'transKey', label: 'Transposition Key', type: 'text', default: 'KEY' }
            ],
            create: (text, params) => new window.nigmajs.Dictionary.ADFGVX(text, params.key, params.transKey),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        adfgx: {
            name: 'ADFGX',
            params: [
                { name: 'key', label: 'Keyword', type: 'text', default: 'KEYWORD' },
                { name: 'transKey', label: 'Transposition Key', type: 'text', default: 'KEY' }
            ],
            create: (text, params) => new window.nigmajs.Dictionary.ADFGX(text, params.key, params.transKey),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        },
        route: {
            name: 'Route',
            params: [
                { name: 'rows', label: 'Rows', type: 'number', default: 5 },
                { name: 'cols', label: 'Columns', type: 'number', default: 5 },
                { name: 'route', label: 'Route Pattern', type: 'text', default: 'spiral' }
            ],
            create: (text, params) => new window.nigmajs.Columnar.Route(text, params.rows, params.cols, params.route),
            encode: (cipher) => cipher.encode(),
            decode: (cipher) => cipher.decode()
        }
    };

    // Mode Switch Logic
    function setMode(mode) {
        currentMode = mode;
        const isEncrypt = mode === 'encrypt';
        
        // Update Buttons
        modeEncryptBtn.classList.toggle('active', isEncrypt);
        modeDecryptBtn.classList.toggle('active', !isEncrypt);
        modeEncryptBtn.style.background = isEncrypt ? 'var(--accent)' : 'transparent';
        modeEncryptBtn.style.color = isEncrypt ? 'white' : 'var(--text-muted)';
        modeDecryptBtn.style.background = !isEncrypt ? 'var(--accent)' : 'transparent';
        modeDecryptBtn.style.color = !isEncrypt ? 'white' : 'var(--text-muted)';

        // Update Labels
        document.querySelector('#plaintext').placeholder = isEncrypt ? "Enter your plaintext here..." : "Enter your ciphertext here...";
        document.querySelector('h2:first-of-type').innerText = isEncrypt ? "📝 Input Text" : "📝 Ciphertext Input";
        
        const resultTitle = document.querySelector('.result-section').parentElement.querySelector('h2');
        if (resultTitle) resultTitle.innerText = isEncrypt ? "✨ Result" : "✨ Decrypted Plaintext";

        // Update Buttons visibility
        reverseBtn.style.display = isEncrypt ? 'inline-block' : 'none';
        executeBtn.innerHTML = isEncrypt ? "🚀 Execute Chain" : "🔓 Decrypt Chain";
        
        // Clear results if any
        result.innerHTML = isEncrypt ? 'Execute the chain to see the encrypted result...' : 'Execute the chain to see the decrypted result...';
    }

    modeEncryptBtn.addEventListener('click', () => setMode('encrypt'));
    modeDecryptBtn.addEventListener('click', () => setMode('decrypt'));


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
        const isEncrypt = currentMode === 'encrypt';
        
        let color = isEncrypt ? '#8b5cf6' : '#f59e0b'; // Purple vs Orange
        let resultColor = isEncrypt ? '#10b981' : '#3b82f6'; // Green vs Blue
        let operationName = isEncrypt ? 'Step' : 'Decryption Step';

        let stepsHTML = `<div style="margin-bottom: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 0.5rem; border-left: 3px solid ${color};">`;
        stepsHTML += `<strong style="color: ${color};">🔍 Intermediate Steps:</strong><br><br>`;
        stepsHTML += `<div style="color: #94a3b8; margin: 0.5rem 0;">Input: <span style="color: ${isEncrypt ? '#10b981' : '#f59e0b'};">${currentText}</span></div>`;

        try {
            chain.forEach((step, index) => {
                const cipher = step.config.create(currentText, step.params);
                const previousText = currentText;
                
                // KEY LOGIC: Encode or Decode based on mode
                if (isEncrypt) {
                    currentText = step.config.encode(cipher);
                } else {
                    currentText = step.config.decode(cipher);
                }
                
                steps.push(currentText);

                stepsHTML += `<div style="margin: 0.5rem 0; padding-left: 1rem; border-left: 2px solid #334155;">`;
                stepsHTML += `<div style="color: ${color};">${operationName} ${index + 1}: ${step.config.name} ${!isEncrypt ? '(Decode)' : ''}</div>`;
                stepsHTML += `<div style="color: #e2e8f0; font-family: 'Fira Code', monospace; font-size: 0.9rem;">${currentText}</div>`;
                stepsHTML += `</div>`;
            });

            stepsHTML += '</div>';

            // Store steps for potential reversal (only in encrypt mode)
            if (isEncrypt) {
                window.encryptionSteps = steps;
                window.encryptedResult = currentText;
            }

            result.innerHTML = stepsHTML + `<div style="margin-top: 1rem; padding: 1rem; background: rgba(${isEncrypt ? '16, 185, 129' : '59, 130, 246'}, 0.1); border: 1px solid ${resultColor}; border-radius: 0.5rem;">
                <strong style="color: ${resultColor};">✨ Final Result:</strong><br>
                <div style="margin-top: 0.5rem; font-family: 'Fira Code', monospace; color: ${resultColor}; word-break: break-all;">${currentText}</div>
            </div>`;

            outputLength.textContent = currentText.length;

            // Update Analysis
            if (freqChart) {
                updateAnalysis(currentText);
            }
            
        } catch (error) {
            result.innerHTML = `<div style="color: #ef4444; padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 0.5rem;">
                <strong>❌ Error:</strong> ${error.message}
            </div>`;
        }
    }

    // Reverse chain and decrypt (Legacy function for Encrypt mode only)
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
        result.textContent = currentMode === 'encrypt' ? 'Execute the chain to see the encrypted result...' : 'Execute the chain to see the decrypted result...';
        outputLength.textContent = '0';
    }

    // Update stats
    function updateStats() {
        stepCount.textContent = chain.length;
        inputLength.textContent = plaintext.value.length;
    }

    // --- Analysis & Visualization ---
    let freqChart = null;
    let currentAnalysisMode = 'monograms'; // monograms, bigrams, trigrams, quadgrams

    // Helper to get sorted keys by frequency
    function getTopKeys(freqObj, n = 15) {
        return Object.entries(freqObj)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([key]) => key);
    }

    function initChart() {
        const ctx = document.getElementById('frequencyChart').getContext('2d');
        
        freqChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Standard Spanish (%)',
                        data: [],
                        backgroundColor: 'rgba(139, 92, 246, 0.2)', // --accent
                        borderColor: 'rgba(139, 92, 246, 1)',
                        borderWidth: 1,
                        order: 3
                    },
                    {
                        label: 'Original Text (%)',
                        data: [],
                        backgroundColor: 'rgba(245, 158, 11, 0.4)', // --warning
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 1,
                        order: 2
                    },
                    {
                        label: 'Ciphered Text (%)',
                        data: [],
                        backgroundColor: 'rgba(16, 185, 129, 0.6)', // --success
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#e2e8f0' } },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    function updateChartData(inputText, outputText) {
        if (!freqChart || !inputText || !outputText) return;

        const { LanguageAnalysis } = window.nigmajs;
        const selectedLang = languageSelect.value;
        const langData = LanguageAnalysis.languages[selectedLang];
        let fullStandardFreqs;
        let inputFreqs, outputFreqs;
        let n = 1;

        if (currentAnalysisMode === 'monograms') {
            fullStandardFreqs = langData.monograms;
            inputFreqs = LanguageAnalysis.getLetterFrequencies(inputText);
            outputFreqs = LanguageAnalysis.getLetterFrequencies(outputText);
            n = 1;
        } else {
            n = currentAnalysisMode === 'bigrams' ? 2 : (currentAnalysisMode === 'trigrams' ? 3 : 4);
            if (currentAnalysisMode === 'bigrams') fullStandardFreqs = langData.bigrams;
            else if (currentAnalysisMode === 'trigrams') fullStandardFreqs = langData.trigrams;
            else fullStandardFreqs = langData.quadgrams;

            inputFreqs = LanguageAnalysis.getNgramFrequencies(inputText, n);
            outputFreqs = LanguageAnalysis.getNgramFrequencies(outputText, n);
        }

        // Update Chart Label
        freqChart.data.datasets[0].label = `Standard ${selectedLang.charAt(0).toUpperCase() + selectedLang.slice(1)} (%)`;

        // Generate merged labels
        let labels = [];
        if (n === 1) {
            // For monograms, always show all letters sorted alphabetically
            labels = Object.keys(fullStandardFreqs).sort();
        } else {
            // For N-grams, merge top frequent items from all sources to ensure visibility
            const standardKeys = getTopKeys(fullStandardFreqs, 15);
            const inputKeys = getTopKeys(inputFreqs, 5);
            const outputKeys = getTopKeys(outputFreqs, 5); // Show what's in the cipher text even if it's weird
            
            const allKeys = new Set([...standardKeys, ...inputKeys, ...outputKeys]);
            labels = Array.from(allKeys);
            
            // Sort by standard frequency magnitude for readability
            labels.sort((a, b) => {
                const stdA = fullStandardFreqs[a] || 0;
                const stdB = fullStandardFreqs[b] || 0;
                return stdB - stdA;
            });
        }

        // Map data to labels (ensure alignment)
        const standardData = labels.map(l => fullStandardFreqs[l] || 0);
        const inputData = labels.map(l => inputFreqs[l] || 0);
        const outputData = labels.map(l => outputFreqs[l] || 0);

        // Update Chart
        freqChart.data.labels = labels;
        freqChart.data.datasets[0].data = standardData;
        freqChart.data.datasets[1].data = inputData;
        freqChart.data.datasets[2].data = outputData;
        
        // Hide "Ciphered Text" if no ciphers are applied
        const isCiphered = chain.length > 0;
        freqChart.data.datasets[2].hidden = !isCiphered;

        freqChart.update();
    }

    function updateAnalysis(outputText) {
        const inputText = plaintext.value;
        if (!outputText || !inputText) return;

        const { LanguageAnalysis } = window.nigmajs;
        const analysis = LanguageAnalysis.analyzeCorrelation(outputText, languageSelect.value);
        
        updateChartData(inputText, outputText);

        // Update Scores Display
        const statsContainer = document.getElementById('analysisStats');
        const createStatBox = (label, score) => {
            let color = '#ef4444'; 
            if (score < 100) color = '#f59e0b'; 
            if (score < 50) color = '#10b981'; 
            
            return `
                <div style="background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 0.25rem; text-align: center; border: 1px solid ${color};">
                    <div style="font-size: 0.8rem; color: #94a3b8;">${label}</div>
                    <div style="font-size: 1.1rem; font-weight: bold; color: ${color};">
                        ${score.toFixed(2)}
                    </div>
                    <div style="font-size: 0.7rem; color: ${color}; opacity: 0.8;">Chi-Squared</div>
                </div>
            `;
        };

        statsContainer.innerHTML = `
            ${createStatBox('Monograms', analysis.monograms.score)}
            ${createStatBox('Bigrams', analysis.bigrams.score)}
            ${createStatBox('Trigrams', analysis.trigrams.score)}
            ${createStatBox('Quadgrams', analysis.quadgrams.score)}
        `;
    }

    // Tabs Logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update mode and chart
            currentAnalysisMode = e.target.dataset.type;
            if (window.encryptedResult) {
                updateChartData(plaintext.value, window.encryptedResult);
            }
        });
    });

    // Event listeners
    languageSelect.addEventListener('change', () => {
        if (window.encryptedResult) {
            updateAnalysis(window.encryptedResult);
        } else if (plaintext.value) {
            // If no result yet, just update chart with plaintext
            updateChartData(plaintext.value, plaintext.value);
        }
    });

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

    // Wait for library to load then init chart
    function checkLibrary() {
        if (window.nigmajs && window.nigmajs.LanguageAnalysis) {
            initChart();
            if (plaintext.value) {
                updateChartData(plaintext.value, plaintext.value);
            }
            
            // Hide loading overlay
            const loader = document.getElementById('loading-overlay');
            if (loader) {
                loader.classList.add('hidden');
                // Remove from DOM after transition
                setTimeout(() => {
                    loader.remove();
                }, 500);
            }

        } else {
            console.warn('NigmaJS not loaded. Retrying...');
            setTimeout(checkLibrary, 500);
        }
    }
    
    checkLibrary();
});
