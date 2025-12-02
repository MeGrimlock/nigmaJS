# NigmaJS Parameter Optimization Suite

> **Developer Tool Only** - This is NOT part of the runtime library. It's an experimental tool for contributors to improve cipher identification accuracy.

## What It Does

Uses a **Genetic Algorithm** to automatically tune the numerical parameters in `src/config/config-loader.js` that control cipher identification behavior.

### Problem It Solves
NigmaJS sometimes misclassifies simple ciphers (Caesar/ROT) as complex ones (Vigenère). This tool finds the optimal thresholds to minimize these errors.

## Quick Start

```bash
# Run optimization (generates dataset + evolves parameters)
npm test tools/optimizer/optimizer.test.js

# Results saved to: tools/optimizer/optimized_config.json
# Manually copy values to: src/config/config-loader.js
```

## How It Works

1. **Dataset Generation** (`dataset-generator.js`)
   - Creates random English/Spanish plaintexts
   - Encrypts with Caesar, Vigenère, ROT47
   - Adds realistic noise (typos, numbers, symbols)

2. **Genetic Algorithm** (`optimizer.js`)
   - Population: 10-50 individuals
   - Genome: 6+ numerical parameters
   - Fitness: Accuracy on dataset (with penalties for specific confusions)
   - Evolution: Tournament selection, crossover, mutation

3. **Evaluation** (`optimizer.test.js`)
   - Runs GA for N generations
   - Saves best configuration
   - Outputs confusion matrix

## Configuration

Edit `optimizer.js` to tune:

```javascript
this.populationSize = 50;  // Larger = slower but better
this.generations = 20;     // More = better convergence
this.mutationRate = 0.1;   // 10% chance per gene
```

### Genome Definition

Add more parameters to optimize:

```javascript
this.genomeDef = [
    { path: 'cipher_identifier.caesar_test.primary_threshold.score', min: 0.4, max: 0.9, type: 'float' },
    // Add more...
];
```

## Advanced Usage

### Multi-Language Optimization

```javascript
// In dataset-generator.js
const dataset = generator.generateDataset(200, 'spanish');
```

### Custom Fitness Penalties

```javascript
// In optimizer.js evaluateFitness()
if (sample.type === 'caesar' && detectedType === 'vigenere-like') {
    correct -= 0.8; // Heavy penalty for this specific error
}
```

### Confusion Matrix

The test outputs a confusion matrix showing before/after improvements:

```
Real \ Predicted  | Caesar | Vigenère | ROT47
------------------|--------|----------|-------
Caesar            |   45   |    5     |   0
Vigenère          |    3   |   44     |   3
ROT47             |    0   |    2     |  48
```

## Best Practices

### 1. Validation Dataset
Don't optimize on the same data you test on:
- Generate 2 datasets: `train.json` and `test.json`
- Optimize on train, validate on test

### 2. Reproducibility
Fix random seeds:
```javascript
Math.seedrandom('nigmajs-optimizer-v1');
```

### 3. Overfitting Prevention
- Use real-world texts (Project Gutenberg, Wikipedia)
- Add noise: typos, mixed case, numbers, symbols
- Test on edge cases

### 4. Performance
- Reduce text length per sample (50-100 chars)
- Early stopping if no improvement for 5 generations
- Parallel fitness evaluation (if using workers)

## Integration with CI

### Quick Check (Fast)
```bash
npm run optimizer:quick-check
```
Evaluates current config against baseline without evolving.

### Full Optimization (Slow)
Run manually before releases to ensure parameters stay optimal.

## Troubleshooting

**"Fitness not improving"**
- Increase population size
- Increase mutation rate
- Check if genome ranges are too narrow

**"Results not reproducible"**
- Fix random seed in both generator and optimizer
- Ensure dataset is saved/loaded consistently

**"Optimization too slow"**
- Reduce dataset size (50 samples is enough for prototyping)
- Reduce generations (5-10 for quick tests)
- Reduce population (10-20 for quick tests)

## Future Enhancements

- [ ] Multi-objective optimization (accuracy + speed)
- [ ] Cross-validation (k-fold)
- [ ] Automated hyperparameter tuning (meta-optimization)
- [ ] Integration with benchmark suite
- [ ] Support for more cipher types

## Contributing

When adding new parameters to optimize:
1. Add to `genomeDef` in `optimizer.js`
2. Update confusion matrix to track new cipher types
3. Document expected impact in this README

---

**Note**: This is experimental. Always validate results manually before committing parameter changes to production.
