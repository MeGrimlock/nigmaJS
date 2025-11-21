const HMM = require('hidden-markov-model-tf');
const tf = require('@tensorflow/tfjs');

async function testHMM() {
    console.log("Testing HMM package...");
    try {
        const hmm = new HMM({
            states: 2,
            dimensions: 2 // This suggests Continuous (Gaussian) dimensions...
        });
        console.log("HMM instance created.");
        console.log(hmm);
    } catch (e) {
        console.error("Error:", e);
    }
}

testHMM();
