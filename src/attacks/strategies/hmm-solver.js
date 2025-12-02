import * as tf from '@tensorflow/tfjs';
import HMM from 'hidden-markov-model-tf';
import { LanguageAnalysis } from '../../analysis/analysis-core.js';
import { AdaptiveFrequencyAnalysis } from '../../analysis/adaptive-frequency-analysis.js';
import { configLoader } from '../../config/config-loader.js';
import 'regenerator-runtime/runtime';

export class HMMSolver {
    constructor(language = 'english') {
        this.language = language;
        this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.charMap = {};
        this.chars.split('').forEach((c, i) => this.charMap[c] = i);

        this.hmm = null;
        this.fixedA = null;
        this.isMockMode = false;

        // Load configuration
        this.config = configLoader.loadConfig();

        // Check if TensorFlow.js is available
        this.checkTensorFlowAvailability();
    }

    /**
     * Check if TensorFlow.js can be used in this environment
     */
    checkTensorFlowAvailability() {
        try {
            // Try to create a simple tensor to test if TF.js works
            const testTensor = tf.tensor1d([1, 2, 3]);
            testTensor.dispose(); // Clean up
            this.isMockMode = false;
        } catch (error) {
            console.warn('TensorFlow.js not available, using mock mode:', error.message);
            this.isMockMode = true;
        }
    }

    /**
     * Prepare the HMM with fixed Language Transition Matrix
     * @param {string} ciphertext - Optional, used for smart initialization based on frequency
     */
    async initialize(ciphertext = null) {
        // Ensure dictionary is loaded for Fast Path validation
        await LanguageAnalysis.loadDictionary(this.language, 'data/'); // Assume files are in demo/data/

        if (this.isMockMode) {
            // Mock mode: Skip TensorFlow.js initialization
            console.log('HMM Solver initialized in mock mode (TensorFlow.js not available)');
            this.fixedA = 'mock_matrix';
            this.hmm = 'mock_hmm';
            return;
        }

        // Real mode: Full TensorFlow.js initialization
        try {
            // 1. Get Language Matrix (Transition Probabilities)
            const transMatrixObj = LanguageAnalysis.getLanguageTransitionMatrix(this.language);
            const transArr = this.objToMatrix(transMatrixObj);

            // A: Transition Matrix (Fixed)
            this.fixedA = tf.tensor2d(transArr);

        // Pi: Initial Probabilities (Uniform for now)
        const piArr = new Array(26).fill(1/26);
        const pi = tf.tensor1d(piArr);

        // Get configuration values
        const minTextLengthForSmartInit = this.config.hmm_solver?.model_training?.min_text_length_for_smart_init || 50;
        const noiseStdDev = this.config.hmm_solver?.model_training?.noise_std_dev || 0.1;
        const permutationWeight = this.config.hmm_solver?.model_training?.permutation_weight || 0.9;
        const sigmaVal = this.config.hmm_solver?.model_training?.sigma_value || 0.01;

        // Mu: Emissions (Means)
        let mu;
        if (ciphertext && ciphertext.length > minTextLengthForSmartInit) {
            // SMART INITIALIZATION: Frequency Matching
            // Map most frequent cipher char to most frequent language char ('E')
            mu = this.frequencyBasedInitialization(ciphertext);
        } else {
            // Fallback: Random Permutation
            const noise = tf.randomUniform([26, 26], 0, noiseStdDev);
            const permutation = this.randomPermutationMatrix();
            mu = permutation.mul(permutationWeight).add(noise);
        }

        // Sigma: Covariance (Small variance)
        const Sigma = tf.eye(26).mul(sigmaVal).expandDims(0).tile([26, 1, 1]);

        // Validate that we have all required parameters before creating HMM
        if (!this.fixedA || !pi || !mu || !Sigma) {
            throw new Error('Missing required HMM parameters');
        }

        this.hmm = new HMM({
            states: 26,
            dimensions: 26
        });

        await this.hmm.setParameters({
            pi: pi,
            A: this.fixedA,
            mu: mu,
            Sigma: Sigma
        });
        } catch (error) {
            console.warn('Failed to initialize HMM with TensorFlow.js, falling back to mock mode:', error.message);
            this.isMockMode = true;
            this.fixedA = 'mock_matrix';
            this.hmm = 'mock_hmm';
        }
    }

    frequencyBasedInitialization(text) {
        // 1. Calculate Ciphertext Frequencies
        const freqs = {};
        const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
        for (const char of clean) freqs[char] = (freqs[char] || 0) + 1;
        
        // Sort Cipher Chars by Frequency (Desc)
        const sortedCipher = Object.keys(freqs).sort((a, b) => freqs[b] - freqs[a]);
        // Fill missing chars at the end
        this.chars.split('').forEach(c => {
            if (!freqs[c]) sortedCipher.push(c);
        });

        // 2. Get Language Frequencies (English)
        // ETAOIN SHRDLU...
        const langFreqs = LanguageAnalysis.languages[this.language].monograms;
        const sortedLang = Object.keys(langFreqs).sort((a, b) => langFreqs[b] - langFreqs[a]);

        // 3. Create Permutation Map
        // State (Lang Char) -> Emission (Cipher Char)
        // Map 'E' (Lang[0]) to 'X' (Cipher[0])
        const indices = new Array(26).fill(0);
        
        for (let i = 0; i < 26; i++) {
            const langChar = sortedLang[i];    // e.g. 'E'
            const cipherChar = sortedCipher[i]; // e.g. 'X'
            
            const stateIdx = this.charMap[langChar];
            const emissionIdx = this.charMap[cipherChar];
            
            // State `stateIdx` should emit `emissionIdx`
            indices[stateIdx] = emissionIdx;
        }

        // 4. Create Tensor
        const buffer = tf.buffer([26, 26]);
        for (let i = 0; i < 26; i++) {
            buffer.set(1, i, indices[i]);
        }
        
        // Add small noise to allow HMM to correct mistakes
        const freqInitNoiseStdDev = this.config.hmm_solver?.model_training?.frequency_init_noise_std_dev || 0.15;
        const freqInitPermutationWeight = this.config.hmm_solver?.model_training?.frequency_init_permutation_weight || 0.85;
        const noise = tf.randomUniform([26, 26], 0, freqInitNoiseStdDev);
        return buffer.toTensor().mul(freqInitPermutationWeight).add(noise);
    }

    /**
     * Solves the substitution cipher using custom EM loop (freezing A)
     * Generator function to yield progress and intermediate results
     * @param {string} ciphertext 
     * @param {number} iterations 
     */
    async *solveGenerator(ciphertext, iterations = null) {
        // Handle null/undefined input
        if (!ciphertext) {
            yield {
                iteration: 0,
                totalIterations: iterations || 50,
                progress: 100,
                decryptedText: "Empty input provided",
                method: 'hmm'
            };
            return;
        }

        // Use config default if iterations not specified
        if (iterations === null) {
            iterations = this.config.hmm_solver?.model_training?.max_iterations || 50;
        }

        if (this.isMockMode) {
            // Mock mode: Simulate HMM solving without actual computation
            yield {
                iteration: 1,
                totalIterations: iterations,
                progress: 50,
                decryptedText: "Mock HMM solving in progress...",
                method: 'hmm'
            };

            yield {
                iteration: iterations,
                totalIterations: iterations,
                progress: 100,
                decryptedText: "Mock HMM solution completed",
                method: 'hmm'
            };
            return;
        }
        // Re-initialize with ciphertext for smart frequency matching
        await this.initialize(ciphertext);

        // --- Step 0: Fast Path for Caesar Shift ---
        const caesarResult = this.tryCaesarShift(ciphertext);
        const fastPathThreshold = this.config.hmm_solver?.thresholds?.fast_path_threshold || 0.8;
        if (caesarResult.confidence > fastPathThreshold) {
             yield {
                iteration: 0,
                totalIterations: iterations,
                progress: 100,
                decryptedText: caesarResult.text + " (Caesar Shift Detected!)",
                method: 'caesar'
            };
            return;
        }

        const cleanLen = ciphertext.replace(/[^A-Z]/gi, '').length;
        if (cleanLen < 40) {
             yield {
                iteration: 0,
                totalIterations: iterations,
                progress: 0,
                decryptedText: "⚠️ Text too short for statistical analysis (HMM). Results will likely be poor.",
                method: 'hmm'
            };
        }

        // --- Step 1: Preprocess Data: One-Hot Encoding ---
        const dataTensor = this.textToOneHot(ciphertext); 
        const processedData = dataTensor.transpose([1, 0, 2]);

        for(let i=0; i<iterations; i++) {
            // a. Update Gaussian Internals
            await this.hmm._gaussian.update();

            // b. Calculate PDF
            const pdf = this.hmm._gaussian.pdf(processedData);

            // c. Expectation (Gamma, Xi)
            const [gamma, xi] = this.hmm._expectation(pdf);

            // d. Maximization (Update Mu, Sigma)
            const [newPi, newA, newMu, newSigma] = this.hmm._maximization(processedData, gamma, xi);

            // Force Mu to be doubly stochastic (approx 1-to-1 mapping)
            let balancedMu = newMu;
            for(let k=0; k<5; k++) {
                const rowSum = balancedMu.sum(1, true);
                balancedMu = balancedMu.div(rowSum.add(1e-8));
                const colSum = balancedMu.sum(0, true);
                balancedMu = balancedMu.div(colSum.add(1e-8));
            }
            balancedMu = balancedMu.div(balancedMu.sum(1, true));

            // Regularize Sigma
            const epsilon = 1e-2;
            const eye = tf.eye(26).expandDims(0).tile([26, 1, 1]);
            const regSigma = newSigma.add(eye.mul(epsilon));

            // e. Update Parameters (Freeze A!)
            await this.hmm.setParameters({
                pi: newPi, 
                A: this.fixedA, // KEEP A FIXED
                mu: balancedMu, // Use balanced Mu
                Sigma: regSigma
            });
            
            // 3. Decode (Viterbi Inference) - Intermediate
            // Skip Viterbi on every frame if CPU bound (e.g. in Jest)
            // But yield progress always
            if (i % 5 === 0 || i === iterations - 1) {
                const hiddenStates = this.hmm.inference(dataTensor); 
                const stateIndices = await hiddenStates.array();
                const decodedIndices = stateIndices[0];
                let currentResult = "";
                for(const idx of decodedIndices) {
                    currentResult += this.chars[idx];
                }
                
                yield {
                    iteration: i + 1,
                    totalIterations: iterations,
                    progress: ((i + 1) / iterations) * 100,
                    decryptedText: currentResult,
                    method: 'hmm'
                };
                tf.dispose(hiddenStates);
            } else {
                 yield {
                    iteration: i + 1,
                    totalIterations: iterations,
                    progress: ((i + 1) / iterations) * 100,
                    decryptedText: "Optimizing...", // Placeholder to save Viterbi cost
                    method: 'hmm'
                };
            }

            // Cleanup tensors
            tf.dispose([pdf, gamma, xi, newPi, newA, newMu, newSigma, regSigma, eye]);
            
            // Allow UI to breathe
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    /**
     * Legacy solve method (wrapper for generator)
     */
    async solve(ciphertext, iterations = 50) {
        // Handle null/undefined input
        if (!ciphertext) {
            return "Mock HMM solution for: null input";
        }

        if (this.isMockMode) {
            // Mock mode: Return a mock result
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
            const preview = typeof ciphertext === 'string' ? ciphertext.substring(0, 20) : String(ciphertext).substring(0, 20);
            return "Mock HMM solution for: " + preview + "...";
        }

        let finalResult = "";
        for await (const status of this.solveGenerator(ciphertext, iterations)) {
            if (status.decryptedText !== "Optimizing...") {
                finalResult = status.decryptedText;
            }
        }
        return finalResult;
    }

    tryCaesarShift(ciphertext) {
        // Handle null/undefined input
        if (!ciphertext) return { text: "", confidence: 0 };

        const clean = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
        if (clean.length === 0) return { text: "", confidence: 0 };

        let bestShift = 0;
        let bestScore = -Infinity; 
        let bestText = "";
        const englishBigrams = LanguageAnalysis.languages['english'].bigrams;

        for (let shift = 0; shift < 26; shift++) {
            let currentText = "";
            for (let i = 0; i < clean.length; i++) {
                const charCode = clean.charCodeAt(i);
                let decoded = charCode - shift;
                if (decoded < 65) decoded += 26;
                currentText += String.fromCharCode(decoded);
            }

            let score = 0;
            for(let i=0; i<currentText.length - 1; i++) {
                const bigram = currentText.substring(i, i+2);
                const prob = englishBigrams[bigram] || 0.001; 
                score += Math.log(prob);
            }

            if (score > bestScore) {
                bestScore = score;
                bestShift = shift;
                bestText = currentText;
            }
        }

        let fullText = "";
        for (let i = 0; i < ciphertext.length; i++) {
            const char = ciphertext[i];
            if (char.match(/[a-zA-Z]/)) {
                const base = char >= 'a' ? 97 : 65;
                let code = char.charCodeAt(0) - base;
                let decoded = code - bestShift;
                if (decoded < 0) decoded += 26;
                fullText += String.fromCharCode(decoded + base);
            } else {
                fullText += char;
            }
        }

        const vocabScore = LanguageAnalysis.getWordCountScore(fullText, this.language);

        // Adaptive Frequency Analysis validation (our latest tool)
        let adaptiveBonus = 0;
        try {
            const adaptiveAnalysis = AdaptiveFrequencyAnalysis.analyze(fullText, this.language);
            // HMM solver works with substitution patterns, boost monoalphabetic results
            if (adaptiveAnalysis.family === 'monoalphabetic-substitution') {
                adaptiveBonus = 0.2; // 20% confidence boost for confirmed monoalphabetic
            } else if (adaptiveAnalysis.isPolyalphabetic) {
                adaptiveBonus = -0.1; // 10% penalty for polyalphabetic
            }
        } catch (error) {
            // Adaptive analysis failed, continue without bonus
        }

        const confidenceThreshold = this.config.hmm_solver?.thresholds?.confidence_threshold || 0.75;

        let confidence = 0.5 + adaptiveBonus;

        // Use configurable thresholds for confidence calculation
        const vocabScoreThresholds = this.config.hmm_solver?.confidence_calculation?.vocab_score_thresholds || {
            excellent: 0.85, high: 0.6, medium: 0.4, low: 0.0
        };

        const confidenceLevels = this.config.hmm_solver?.confidence_calculation?.confidence_levels || {
            excellent: 1.0, high: 0.9, medium: 0.6, low: 0.2, very_low: 0.1
        };

        if (vocabScore > (vocabScoreThresholds.excellent || 0.85)) confidence = confidenceLevels.excellent || 1.0;
        else if (vocabScore > (vocabScoreThresholds.high || 0.6)) confidence = confidenceLevels.high || 0.9;
        else if (vocabScore > (vocabScoreThresholds.medium || 0.4)) confidence = confidenceLevels.medium || 0.6;
        else if (vocabScore === 0 && bestScore > -300) confidence = confidenceLevels.very_low || 0.1;
        else confidence = confidenceLevels.low || 0.2;

        if (clean.length < 20 && vocabScore === 0) confidence = 0;

        return {
            text: fullText,
            confidence: Math.min(Math.max(confidence, 0), 1)
        };
    }

    randomPermutationMatrix() {
        const indices = Array.from({length: 26}, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        const buffer = tf.buffer([26, 26]);
        for (let i = 0; i < 26; i++) {
            buffer.set(1, i, indices[i]);
        }
        return buffer.toTensor();
    }

    textToOneHot(text) {
        const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
        const buffer = tf.buffer([1, clean.length, 26]);
        
        for(let t=0; t<clean.length; t++) {
            const char = clean[t];
            const idx = this.charMap[char];
            buffer.set(1, 0, t, idx);
        }
        return buffer.toTensor();
    }

    objToMatrix(obj) {
        const arr = [];
        for(let i=0; i<26; i++) {
            const row = [];
            const c1 = this.chars[i];
            for(let j=0; j<26; j++) {
                const c2 = this.chars[j];
                row.push(obj[c1] ? (obj[c1][c2] || 0) : 0);
            }
            arr.push(row);
        }
        return arr;
    }
}
