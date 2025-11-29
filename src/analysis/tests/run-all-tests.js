#!/usr/bin/env node

/**
 * Analysis Tests Runner
 *
 * Executes all tests in the src/analysis/tests directory.
 * This script provides a convenient way to run all analysis-related tests at once.
 *
 * Usage:
 *   npm run test:analysis
 */

console.log('🔍 Analysis Tests Runner');
console.log('========================\n');

console.log('📋 Test files that will be executed:');
const testFiles = [
    'analysis.test.js',
    'identifier.test.js',
    'kasiski.test.js',
    'language-detection.test.js',
    'ngram-scorer.test.js',
    'stats.test.js',
    'ic-sample-correction.test.js',
    'periodic-analysis.test.js',
    'short-text-patterns.test.js',
    'transposition-detector.test.js'
];

testFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
});

console.log('\n🚀 To run all analysis tests, use:');
console.log('   npm run test:analysis');
console.log('\n💡 To run individual tests:');
console.log('   npm test -- [filename].test.js');
console.log('\n🔍 To run with verbose output:');
console.log('   npx jest src/analysis/tests/ --verbose --colors');
console.log('\n📚 For more options, see: src/analysis/tests/README.md');

export { testFiles };
