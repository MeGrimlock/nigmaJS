#!/usr/bin/env node

/**
 * Attacks Module Test Runner
 *
 * Executes all tests in the src/attacks/tests directory.
 * This script provides a convenient way to run all attacks-related tests at once.
 *
 * Usage:
 *   npm run test:attacks
 */

console.log('🔍 Attacks Module Test Runner');
console.log('==============================\n');

console.log('📋 Test files that will be executed:');
const testFiles = [
    // Individual Solver Tests (11 files)
    'atbash-solver.test.js',
    'caesar-brute-force.test.js',
    'vigenere-solver.test.js',
    'baconian-solver.test.js',
    'rot47-brute-force.test.js',
    'polybius-solver.test.js',
    'amsco-solver.test.js',
    'autokey-solver.test.js',
    'railfence-solver.test.js',
    'substitution-strategy.test.js',
    'vigenere-strategy.test.js',

    // Orchestrator Tests (5 files)
    'orchestrator/orchestrator.test.js',
    'orchestrator/orchestrator-comprehensive.test.js',
    'orchestrator/orchestrator-e2e.test.js',
    'orchestrator/orchestrator-comprehensive-e2e.test.js',
    'orchestrator/orchestrator-dictionary.test.js',

    // Phase 2 Language Tests (6 files)
    'phase2/phase2-english.test.js',
    'phase2/phase2-spanish.test.js',
    'phase2/phase2-french.test.js',
    'phase2/phase2-italian.test.js',
    'phase2/phase2-portuguese.test.js',
    'phase2/phase2-german.test.js',

    // Specialized Algorithm Tests (2 files)
    'hmm-solver.test.js',
    'polyalphabetic-solver.test.js',

    // Benchmark Tests (1 file)
    'decryption-benchmark.test.js'
];

console.log(`   Total: ${testFiles.length} test files across 5 categories\n`);
console.log('📊 Categories:');
console.log('   🔐 Individual Solver Tests: 11 files');
console.log('   🎯 Orchestrator Tests: 5 files');
console.log('   🌍 Phase 2 Language Tests: 6 files');
console.log('   🔬 Specialized Algorithm Tests: 2 files');
console.log('   ⚡ Benchmark Tests: 1 file\n');

console.log('🚀 To run all attacks tests, use:');
console.log('   npm run test:attacks');
console.log('\n💡 To run individual tests:');
console.log('   npm test -- src/attacks/tests/[filename].test.js');
console.log('\n🔍 To run with verbose output:');
console.log('   npx jest src/attacks/tests/ --verbose --colors');
console.log('\n📚 For more options, see: src/attacks/tests/README.md');

export { testFiles };
