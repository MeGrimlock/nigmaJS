const path = require('path');
const fs = require('fs');
const DatasetGenerator = require('./dataset-generator');
const Optimizer = require('./optimizer');

// Increase timeout significantly for GA
jest.setTimeout(300000); // 5 minutes

describe('Parameter Optimization Suite', () => {
    test('should run genetic algorithm and find optimized parameters', async () => {
        console.log('=== NigmaJS Parameter Optimization Suite (Jest Edition) ===');

        // 1. Generate Dataset
        console.log('\n[1/3] Generating Training Dataset...');
        const generator = new DatasetGenerator();
        const dataset = generator.generateDataset(50); // Reduced to 50 for speed
        const datasetPath = path.join(__dirname, 'dataset.json');
        fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));
        console.log(`Generated ${dataset.length} samples.`);

        // 2. Run Optimizer
        console.log('\n[2/3] Running Genetic Algorithm Optimizer...');

        const optimizer = new Optimizer(datasetPath);
        optimizer.generations = 5; // Reduced to 5
        optimizer.populationSize = 10; // Reduced to 10

        const bestIndividual = await optimizer.run();

        // 3. Output Results
        console.log('\n[3/3] Optimization Complete!');
        console.log('Best Fitness:', bestIndividual.fitness);

        const outputPath = path.join(__dirname, 'optimized_config.json');
        fs.writeFileSync(outputPath, JSON.stringify(bestIndividual.genes, null, 2));
        console.log(`\n=== OPTIMIZED CONFIGURATION SAVED TO ${outputPath} ===`);

        expect(bestIndividual.fitness).toBeGreaterThan(0);
    });
});
