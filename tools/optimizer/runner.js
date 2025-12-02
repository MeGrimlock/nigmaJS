const path = require('path');
const fs = require('fs');

const DatasetGenerator = require('./dataset-generator');
const Optimizer = require('./optimizer');

async function main() {
    console.log('=== NigmaJS Parameter Optimization Suite ===');

    // 1. Generate Dataset
    console.log('\n[1/3] Generating Training Dataset...');
    const generator = new DatasetGenerator();
    const dataset = generator.generateDataset(200); // 200 samples for speed/coverage balance
    const datasetPath = path.join(__dirname, 'dataset.json');
    fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));
    console.log(`Generated ${dataset.length} samples.`);

    // 2. Run Optimizer
    console.log('\n[2/3] Running Genetic Algorithm Optimizer...');
    console.log('Target: Maximize Cipher Identification Accuracy');
    console.log('Focus: Distinguishing Caesar/ROT from Vigenère');

    const optimizer = new Optimizer(datasetPath);
    const bestIndividual = await optimizer.run();

    // 3. Output Results
    console.log('\n[3/3] Optimization Complete!');
    console.log('Best Fitness:', bestIndividual.fitness);
    console.log('\n=== OPTIMIZED CONFIGURATION ===');
    console.log(JSON.stringify(bestIndividual.genes, null, 2));
    console.log('\nCopy the values above into src/config/config-loader.js defaults.');
}

main().catch(err => {
    console.error('Optimization failed:', err);
});
