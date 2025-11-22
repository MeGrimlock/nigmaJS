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

        // 1. Preprocess Data: One-Hot Encoding
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

            // Regularize Sigma to prevent singularity
            const epsilon = 1e-2;
            const eye = tf.eye(26).expandDims(0).tile([26, 1, 1]);
            const regSigma = newSigma.add(eye.mul(epsilon));

            // e. Update Parameters (Freeze A!)
            await this.hmm.setParameters({
                pi: newPi, 
                A: this.fixedA, // KEEP A FIXED
                mu: newMu,     
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
                decryptedText: currentResult
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

