const fs = require('fs');
const path = require('path');

const { CipherIdentifier } = require('../../src/analysis/identifier');
const { configLoader } = require('../../src/config/config-loader');

class Optimizer {
    constructor(datasetPath, language = 'english') {
        this.dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
        this.language = language;
        this.populationSize = 50;
        this.mutationRate = 0.1;
        this.eliteSize = 2;
        this.generations = 20;

        // Tracking
        this.bestFitnessHistory = [];
        this.confusionMatrices = [];

        // Define the genome: Parameters to tune
        this.genomeDef = [
            { path: 'cipher_identifier.caesar_test.primary_threshold.score', min: 0.4, max: 0.9, type: 'float' },
            { path: 'cipher_identifier.caesar_test.primary_threshold.improvement', min: 0.05, max: 0.3, type: 'float' },
            { path: 'cipher_identifier.caesar_test.secondary_threshold.score', min: 0.3, max: 0.7, type: 'float' },
            { path: 'cipher_identifier.caesar_test.vigenere_penalty', min: 1.0, max: 3.0, type: 'float' },
            { path: 'cipher_identifier.caesar_test.monoalphabetic_boost', min: 1.0, max: 2.0, type: 'float' },
            { path: 'ic_analysis.tolerance.short', min: 0.1, max: 1.5, type: 'float' },
        ];
    }

    // --- Confusion Matrix ---

    createConfusionMatrix() {
        return {
            caesar: { caesar: 0, vigenere: 0, monoalphabetic: 0, transposition: 0, unknown: 0 },
            vigenere: { caesar: 0, vigenere: 0, monoalphabetic: 0, transposition: 0, unknown: 0 },
            rot47: { caesar: 0, vigenere: 0, monoalphabetic: 0, transposition: 0, unknown: 0 },
            plaintext: { caesar: 0, vigenere: 0, monoalphabetic: 0, transposition: 0, unknown: 0 }
        };
    }

    printConfusionMatrix(matrix, title = 'Confusion Matrix') {
        console.log(`\n${title}`);
        console.log('Real \\ Predicted | Caesar | Vigenère | Mono | Trans | Unknown');
        console.log('-----------------|--------|----------|------|-------|--------');

        for (const [realType, predictions] of Object.entries(matrix)) {
            const row = [
                realType.padEnd(16),
                predictions.caesar.toString().padStart(6),
                predictions.vigenere.toString().padStart(8),
                predictions.monoalphabetic.toString().padStart(4),
                predictions.transposition.toString().padStart(5),
                predictions.unknown.toString().padStart(7)
            ];
            console.log(row.join(' | '));
        }
    }

    // --- Genetic Algorithm Core ---

    createIndividual() {
        const genes = {};
        for (const def of this.genomeDef) {
            if (def.type === 'int') {
                genes[def.path] = Math.floor(Math.random() * (def.max - def.min + 1)) + def.min;
            } else {
                genes[def.path] = Math.random() * (def.max - def.min) + def.min;
            }
        }
        return { genes, fitness: 0, confusionMatrix: null };
    }

    createPopulation() {
        const pop = [];
        for (let i = 0; i < this.populationSize; i++) {
            pop.push(this.createIndividual());
        }
        return pop;
    }

    applyConfig(genes) {
        const baseConfig = configLoader.getDefaultConfig();

        const setPath = (obj, pathStr, value) => {
            const keys = pathStr.split('.');
            let current = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        };

        for (const [pathStr, value] of Object.entries(genes)) {
            setPath(baseConfig, pathStr, value);
        }

        configLoader.config = baseConfig;
    }

    async evaluateFitness(individual) {
        this.applyConfig(individual.genes);

        let correct = 0;
        const confusionMatrix = this.createConfusionMatrix();

        for (const sample of this.dataset) {
            try {
                const result = await CipherIdentifier.identify(sample.ciphertext, this.language);
                const detectedType = result.families[0].type;

                // Map detected type to confusion matrix categories
                let detectedCategory = 'unknown';
                if (detectedType === 'caesar-shift') detectedCategory = 'caesar';
                else if (detectedType === 'vigenere-like') detectedCategory = 'vigenere';
                else if (detectedType === 'monoalphabetic-substitution') detectedCategory = 'monoalphabetic';
                else if (detectedType === 'transposition') detectedCategory = 'transposition';

                // Update confusion matrix
                if (confusionMatrix[sample.type]) {
                    confusionMatrix[sample.type][detectedCategory]++;
                }

                // Weighted scoring with specific penalties
                if (sample.type === 'caesar') {
                    if (detectedType === 'caesar-shift') correct += 1.0;
                    else if (detectedType === 'vigenere-like') correct -= 0.8; // HEAVY penalty
                    else if (detectedType === 'monoalphabetic-substitution') correct += 0.3; // Partial credit
                } else if (sample.type === 'vigenere') {
                    if (detectedType === 'vigenere-like') correct += 1.0;
                    else if (detectedType === 'caesar-shift') correct -= 0.6; // Penalty
                } else if (sample.type === 'rot47') {
                    // ROT47 might be detected as unknown or monoalphabetic
                    if (detectedType === 'monoalphabetic-substitution') correct += 0.5;
                    else if (detectedType === 'unknown') correct += 0.3;
                }

            } catch (e) {
                // Error in identification
            }
        }

        individual.fitness = Math.max(0, correct);
        individual.confusionMatrix = confusionMatrix;
        return individual.fitness;
    }

    crossover(parent1, parent2) {
        const childGenes = {};
        for (const def of this.genomeDef) {
            childGenes[def.path] = Math.random() < 0.5 ? parent1.genes[def.path] : parent2.genes[def.path];
        }
        return { genes: childGenes, fitness: 0, confusionMatrix: null };
    }

    mutate(individual) {
        const mutatedGenes = { ...individual.genes };
        for (const def of this.genomeDef) {
            if (Math.random() < this.mutationRate) {
                const range = def.max - def.min;
                const delta = (Math.random() - 0.5) * range * 0.2;
                let newVal = mutatedGenes[def.path] + delta;

                newVal = Math.max(def.min, Math.min(def.max, newVal));

                if (def.type === 'int') newVal = Math.round(newVal);
                mutatedGenes[def.path] = newVal;
            }
        }
        return { genes: mutatedGenes, fitness: 0, confusionMatrix: null };
    }

    selectParent(population) {
        const tournamentSize = 3;
        let best = null;
        for (let i = 0; i < tournamentSize; i++) {
            const ind = population[Math.floor(Math.random() * population.length)];
            if (!best || ind.fitness > best.fitness) {
                best = ind;
            }
        }
        return best;
    }

    async run() {
        console.log('Initializing population...');
        let population = this.createPopulation();

        let noImprovementCount = 0;
        let lastBestFitness = -Infinity;

        for (let gen = 0; gen < this.generations; gen++) {
            console.log(`\nGeneration ${gen + 1}/${this.generations}`);

            // Evaluate
            for (const ind of population) {
                await this.evaluateFitness(ind);
            }

            // Sort
            population.sort((a, b) => b.fitness - a.fitness);

            const bestFitness = population[0].fitness;
            const avgFitness = population.reduce((sum, ind) => sum + ind.fitness, 0) / this.populationSize;

            this.bestFitnessHistory.push({ generation: gen + 1, fitness: bestFitness });

            console.log(`  Best Fitness: ${bestFitness.toFixed(2)}`);
            console.log(`  Avg Fitness:  ${avgFitness.toFixed(2)}`);
            console.log(`  Improvement:  ${(bestFitness - lastBestFitness).toFixed(2)}`);

            // Early stopping
            if (Math.abs(bestFitness - lastBestFitness) < 0.01) {
                noImprovementCount++;
                if (noImprovementCount >= 5) {
                    console.log(`\n  Early stopping: No improvement for 5 generations`);
                    break;
                }
            } else {
                noImprovementCount = 0;
            }

            lastBestFitness = bestFitness;

            // Elitism
            const newPop = population.slice(0, this.eliteSize);

            // Breed
            while (newPop.length < this.populationSize) {
                const p1 = this.selectParent(population);
                const p2 = this.selectParent(population);
                let child = this.crossover(p1, p2);
                child = this.mutate(child);
                newPop.push(child);
            }

            population = newPop;
        }

        // Final evaluation
        for (const ind of population) {
            await this.evaluateFitness(ind);
        }
        population.sort((a, b) => b.fitness - a.fitness);

        // Print confusion matrix for best individual
        this.printConfusionMatrix(population[0].confusionMatrix, 'Final Confusion Matrix (Best Individual)');

        return population[0];
    }
}

module.exports = Optimizer;
