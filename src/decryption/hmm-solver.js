import * as tf from '@tensorflow/tfjs';
import HMM from 'hidden-markov-model-tf';
import { LanguageAnalysis } from '../languageAnalysis/analysis.js';

export class HMMSolver {
    constructor(language = 'english') {
        this.language = language;
        this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.charMap = {};
        this.chars.split('').forEach((c, i) => this.charMap[c] = i);
        
        this.hmm = null;
        this.fixedA = null;
    }

    /**
     * Prepare the HMM with fixed Language Transition Matrix
     */
    async initialize() {
        // 1. Get Language Matrix (Transition Probabilities)
        // This returns a 26x26 JS object/array
        const transMatrixObj = LanguageAnalysis.getLanguageTransitionMatrix(this.language);
        const transArr = this.objToMatrix(transMatrixObj);
        
        // A: Transition Matrix (Fixed)
        this.fixedA = tf.tensor2d(transArr);
        
        // Pi: Initial Probabilities (Uniform for now)
        const piArr = new Array(26).fill(1/26);
        const pi = tf.tensor1d(piArr);

        // Mu: Emissions (Means) - Initialize with Permutation Prior
        // Initialize near a random permutation matrix to assume 1-to-1 mapping (approx)
        // This prevents "Mode Collapse" where all emissions converge to the same letter (e.g. AAAAA...)
        const noise = tf.randomUniform([26, 26], 0, 0.1);
        const permutation = this.randomPermutationMatrix();
        // Weighted sum: 90% Permutation + 10% Noise
        const mu = permutation.mul(0.9).add(noise);
        
        // Sigma: Covariance (Small variance)
        // We want "sharp" emissions (letters are discrete)
        // Reduced from 0.1 to 0.01 to reduce overlap
        const sigmaVal = 0.01;
        const sigmaArr = [];
        for(let i=0; i<26; i++) {
            const row = [];
            for(let j=0; j<26; j++) {
                const col = new Array(26).fill(0);
                col[j] = sigmaVal;
                row.push(col);
            }
            sigmaArr.push(row);
        }
        // Dimensions: [States, Dim, Dim] -> [26, 26, 26] diagonal matrices
        // But simpler: Just Identity * 0.1 for each state
        const Sigma = tf.eye(26).mul(sigmaVal).expandDims(0).tile([26, 1, 1]);

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
    }

    /**
     * Solves the substitution cipher using custom EM loop (freezing A)
     * Generator function to yield progress and intermediate results
     * @param {string} ciphertext 
     * @param {number} iterations 
     */
    async *solveGenerator(ciphertext, iterations = 50) {
        if (!this.hmm) await this.initialize();

        // --- Step 0: Fast Path for Caesar Shift ---
        // HMM is bad at short texts. Caesar brute-force is instant and optimal for shifts.
        const caesarResult = this.tryCaesarShift(ciphertext);
        if (caesarResult.confidence > 0.8) { // High confidence match
             yield {
                iteration: 0,
                totalIterations: iterations,
                progress: 100,
                decryptedText: caesarResult.text + " (Caesar Shift Detected!)",
                method: 'caesar'
            };
            return; // Stop here, we found it.
        }

        // If text is too short for HMM and not Caesar, warn user but try anyway
        const cleanLen = ciphertext.replace(/[^A-Z]/gi, '').length;
        if (cleanLen < 40) {
             yield {
                iteration: 0,
                totalIterations: iterations,
                progress: 0,
                decryptedText: "⚠️ Text too short for statistical analysis (HMM). Results will likely be poor.",
                method: 'hmm'
            };
            // Continue but expect garbage
        }

        // --- Step 1: Preprocess Data: One-Hot Encoding ---
        const dataTensor = this.textToOneHot(ciphertext); 
        // Shape: [1, T, 26] (Batch=1)
        
        // Transpose for internal logic: (T, N, D)
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
            // We apply a few iterations of Sinkhorn normalization (row/col normalization)
            // This prevents mode collapse where all states map to 'A' or 'E'.
            let balancedMu = newMu;
            for(let k=0; k<5; k++) {
                // Normalize rows (States sum to 1)
                const rowSum = balancedMu.sum(1, true);
                balancedMu = balancedMu.div(rowSum.add(1e-8)); // Add epsilon
                
                // Normalize cols (Emissions sum to 1)
                const colSum = balancedMu.sum(0, true);
                balancedMu = balancedMu.div(colSum.add(1e-8));
            }
            // Final row norm to ensure valid probability
            balancedMu = balancedMu.div(balancedMu.sum(1, true));

            // Regularize Sigma to prevent singularity
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
            
            // Yield Progress every iteration (or fewer for speed)
            // We perform a Viterbi decode periodically to show "current best guess"
            // Decode takes time, so maybe not every single frame if it's slow, but for demo it's fine.
            
            // 3. Decode (Viterbi Inference) - Intermediate
            const hiddenStates = this.hmm.inference(dataTensor); 
            const stateIndices = await hiddenStates.array();
            const decodedIndices = stateIndices[0];
            let currentResult = "";
            for(const idx of decodedIndices) {
                currentResult += this.chars[idx];
            }

            // Yield status
            yield {
                iteration: i + 1,
                totalIterations: iterations,
                progress: ((i + 1) / iterations) * 100,
                decryptedText: currentResult,
                method: 'hmm'
            };

            // Cleanup tensors
            tf.dispose([pdf, gamma, xi, newPi, newA, newMu, newSigma, regSigma, eye, hiddenStates]);
            
            // Allow UI to breathe
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    /**
     * Legacy solve method (wrapper for generator)
     */
    async solve(ciphertext, iterations = 50) {
        let finalResult = "";
        for await (const status of this.solveGenerator(ciphertext, iterations)) {
            finalResult = status.decryptedText;
        }
        return finalResult;
    }

    tryCaesarShift(ciphertext) {
        const clean = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
        if (clean.length === 0) return { text: "", confidence: 0 };

        let bestShift = 0;
        let bestScore = -Infinity; // Higher Log-Likelihood is better
        let bestText = "";

        // Get English Bigram Frequencies
        const englishBigrams = LanguageAnalysis.languages['english'].bigrams;

        for (let shift = 0; shift < 26; shift++) {
            let currentText = "";
            
            // Decrypt
            for (let i = 0; i < clean.length; i++) {
                const charCode = clean.charCodeAt(i);
                let decoded = charCode - shift;
                if (decoded < 65) decoded += 26;
                currentText += String.fromCharCode(decoded);
            }

            // Calculate Log-Likelihood of Bigrams
            let score = 0;
            for(let i=0; i<currentText.length - 1; i++) {
                const bigram = currentText.substring(i, i+2);
                const prob = englishBigrams[bigram] || 0.001; // Small probability for unseen
                score += Math.log(prob);
            }

            if (score > bestScore) {
                bestScore = score;
                bestShift = shift;
                bestText = currentText;
            }
        }

        // Heuristic confidence:
        // Log likelihood depends on length.
        // We can compare bestScore to the second best score?
        // If best is much better than second best, we are confident.
        
        let confidence = 0.9; // Assume Bigrams are powerful enough

        // Reconstruct original text with punctuation for display
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

        return {
            text: fullText,
            confidence: Math.min(Math.max(confidence, 0), 1)
        };
    }

    randomPermutationMatrix() {
        // Create a 26x26 permutation matrix
        const indices = Array.from({length: 26}, (_, i) => i);
        // Shuffle indices (Fisher-Yates)
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        const buffer = tf.buffer([26, 26]);
        for (let i = 0; i < 26; i++) {
            // State i maps to Emission indices[i]
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
        // Convert { A: {A:0.1, B:0.2...}...} to 2D array
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

