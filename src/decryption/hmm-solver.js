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

        // Mu: Emissions (Means) - Initialize Randomly
        // We want to learn this. It represents P(CipherChar | PlainChar)
        // In Gaussian approximation with One-Hot, Mu[i] is a vector of size 26.
        // Ideally close to One-Hot.
        const mu = tf.randomUniform([26, 26], 0, 1);
        
        // Sigma: Covariance (Small variance)
        // We want "sharp" emissions (letters are discrete)
        const sigmaVal = 0.1;
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
     * @param {string} ciphertext 
     * @param {number} iterations 
     */
    async solve(ciphertext, iterations = 50) {
        if (!this.hmm) await this.initialize();

        // 1. Preprocess Data: One-Hot Encoding
        const dataTensor = this.textToOneHot(ciphertext); 
        // Shape: [1, T, 26] (Batch=1)
        
        // 2. Custom Training Loop
        // We cannot use hmm.fit() because it updates A. We want A fixed.
        
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
            // We ignore the returned A and Pi, and use our fixed ones
            const [newPi, newA, newMu, newSigma] = this.hmm._maximization(processedData, gamma, xi);

            // e. Update Parameters (Freeze A!)
            await this.hmm.setParameters({
                pi: newPi, // We can update Pi (start probs)
                A: this.fixedA, // KEEP A FIXED to Language Model
                mu: newMu,     // Update Emissions (The Key!)
                Sigma: newSigma // Update Variance
            });
            
            // Dispose tensors to prevent leak
            if (i % 10 === 0) console.log(`Iteration ${i+1}/${iterations}`);
            tf.dispose([pdf, gamma, xi, newPi, newA, newMu, newSigma]);
        }

        // 3. Decode (Viterbi Inference)
        // Now that Mu is optimized, find best state sequence
        const hiddenStates = this.hmm.inference(dataTensor); // Shape [1, T]
        const stateIndices = await hiddenStates.array();
        
        // 4. Convert Indices back to Text
        const decodedIndices = stateIndices[0];
        let result = "";
        for(const idx of decodedIndices) {
            result += this.chars[idx];
        }

        return result;
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

