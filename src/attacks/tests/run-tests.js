#!/usr/bin/env node

/**
 * Test Runner - Parametrized Entry Point
 * 
 * This script provides a unified way to run different test suites with parameters.
 * 
 * Usage:
 *   node src/attacks/tests/run-tests.js --suite <suite-name> [options]
 * 
 * Available test suites:
 *   - phase2-all: Run all Phase 2 language tests
 *   - phase2-<language>: Run Phase 2 tests for specific language (english, spanish, french, italian, portuguese, german)
 *   - orchestrator-all: Run all orchestrator tests
 *   - orchestrator-basic: Run basic orchestrator tests
 *   - orchestrator-comprehensive: Run comprehensive orchestrator tests
 *   - orchestrator-e2e: Run end-to-end orchestrator tests
 *   - orchestrator-dictionary: Run dictionary validation tests
 * 
 * Options:
 *   --suite <name>: Test suite to run (required)
 *   --verbose: Enable verbose output
 *   --coverage: Generate coverage report
 *   --help: Show this help message
 * 
 * Examples:
 *   node src/attacks/tests/run-tests.js --suite phase2-english
 *   node src/attacks/tests/run-tests.js --suite orchestrator-all --verbose
 *   node src/attacks/tests/run-tests.js --suite phase2-all --coverage
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test suite definitions
const TEST_SUITES = {
    // Phase 2 Tests
    'phase2-all': {
        description: 'Run all Phase 2 cipher detection tests (all languages)',
        files: [
            'phase2/phase2-english.test.js',
            'phase2/phase2-spanish.test.js',
            'phase2/phase2-french.test.js',
            'phase2/phase2-italian.test.js',
            'phase2/phase2-portuguese.test.js',
            'phase2/phase2-german.test.js'
        ],
        category: 'phase2'
    },
    'phase2-english': {
        description: 'Phase 2 tests for English language',
        files: ['phase2/phase2-english.test.js'],
        category: 'phase2'
    },
    'phase2-spanish': {
        description: 'Phase 2 tests for Spanish language',
        files: ['phase2/phase2-spanish.test.js'],
        category: 'phase2'
    },
    'phase2-french': {
        description: 'Phase 2 tests for French language',
        files: ['phase2/phase2-french.test.js'],
        category: 'phase2'
    },
    'phase2-italian': {
        description: 'Phase 2 tests for Italian language',
        files: ['phase2/phase2-italian.test.js'],
        category: 'phase2'
    },
    'phase2-portuguese': {
        description: 'Phase 2 tests for Portuguese language',
        files: ['phase2/phase2-portuguese.test.js'],
        category: 'phase2'
    },
    'phase2-german': {
        description: 'Phase 2 tests for German language',
        files: ['phase2/phase2-german.test.js'],
        category: 'phase2'
    },
    
    // Orchestrator Tests
    'orchestrator-all': {
        description: 'Run all orchestrator tests',
        files: [
            'orchestrator/orchestrator.test.js',
            'orchestrator/orchestrator-comprehensive.test.js',
            'orchestrator/orchestrator-e2e.test.js',
            'orchestrator/orchestrator-comprehensive-e2e.test.js',
            'orchestrator/orchestrator-dictionary.test.js'
        ],
        category: 'orchestrator'
    },
    'orchestrator-basic': {
        description: 'Basic orchestrator functionality tests',
        files: ['orchestrator/orchestrator.test.js'],
        category: 'orchestrator'
    },
    'orchestrator-comprehensive': {
        description: 'Comprehensive orchestrator tests (multiple ciphers, languages, edge cases)',
        files: ['orchestrator/orchestrator-comprehensive.test.js'],
        category: 'orchestrator'
    },
    'orchestrator-e2e': {
        description: 'End-to-end orchestrator tests (language detection + cipher detection + decryption)',
        files: ['orchestrator/orchestrator-e2e.test.js'],
        category: 'orchestrator'
    },
    'orchestrator-comprehensive-e2e': {
        description: 'Comprehensive E2E tests with strict validation',
        files: ['orchestrator/orchestrator-comprehensive-e2e.test.js'],
        category: 'orchestrator'
    },
    'orchestrator-dictionary': {
        description: 'Dictionary validation tests for orchestrator',
        files: ['orchestrator/orchestrator-dictionary.test.js'],
        category: 'orchestrator'
    },
    
    // Other Tests
    'all': {
        description: 'Run all test suites',
        files: [
            // Phase 2
            'phase2/phase2-english.test.js',
            'phase2/phase2-spanish.test.js',
            'phase2/phase2-french.test.js',
            'phase2/phase2-italian.test.js',
            'phase2/phase2-portuguese.test.js',
            'phase2/phase2-german.test.js',
            // Orchestrator
            'orchestrator/orchestrator.test.js',
            'orchestrator/orchestrator-comprehensive.test.js',
            'orchestrator/orchestrator-e2e.test.js',
            'orchestrator/orchestrator-comprehensive-e2e.test.js',
            'orchestrator/orchestrator-dictionary.test.js',
            // Other
            'hmm-solver.test.js',
            'polyalphabetic-solver.test.js',
            'decryption-benchmark.test.js'
        ],
        category: 'all'
    }
};

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        suite: null,
        verbose: false,
        coverage: false,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--suite' && i + 1 < args.length) {
            options.suite = args[++i];
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--coverage' || arg === '-c') {
            options.coverage = true;
        } else if (arg === '--help' || arg === '-h') {
            options.help = true;
        }
    }
    
    return options;
}

// Show help message
function showHelp() {
    console.log(`
Test Runner - Parametrized Entry Point
======================================

Usage:
  node src/attacks/tests/run-tests.js --suite <suite-name> [options]

Available Test Suites:
  Phase 2 Tests (Cipher Detection & Validation):
    phase2-all              Run all Phase 2 tests (all languages)
    phase2-english          Phase 2 tests for English
    phase2-spanish          Phase 2 tests for Spanish
    phase2-french           Phase 2 tests for French
    phase2-italian          Phase 2 tests for Italian
    phase2-portuguese       Phase 2 tests for Portuguese
    phase2-german           Phase 2 tests for German

  Orchestrator Tests:
    orchestrator-all         Run all orchestrator tests
    orchestrator-basic       Basic orchestrator functionality
    orchestrator-comprehensive  Comprehensive tests (multiple ciphers/languages)
    orchestrator-e2e         End-to-end tests (language + cipher + decryption)
    orchestrator-comprehensive-e2e  Comprehensive E2E with strict validation
    orchestrator-dictionary  Dictionary validation tests

  Other:
    all                     Run all test suites

Options:
  --suite <name>    Test suite to run (required)
  --verbose, -v     Enable verbose output
  --coverage, -c    Generate coverage report
  --help, -h        Show this help message

Examples:
  node src/attacks/tests/run-tests.js --suite phase2-english
  node src/attacks/tests/run-tests.js --suite orchestrator-all --verbose
  node src/attacks/tests/run-tests.js --suite phase2-all --coverage

For detailed information about each test file, see:
  docs/TEST_STRUCTURE.md
`);
}

// Run tests
function runTests(suiteName, options) {
    const suite = TEST_SUITES[suiteName];
    
    if (!suite) {
        console.error(`\n❌ Error: Unknown test suite "${suiteName}"`);
        console.error(`\nAvailable suites: ${Object.keys(TEST_SUITES).join(', ')}`);
        console.error(`\nUse --help for more information.\n`);
        process.exit(1);
    }
    
    console.log(`\n📋 Running test suite: ${suiteName}`);
    console.log(`📝 Description: ${suite.description}`);
    console.log(`📁 Files: ${suite.files.length} file(s)\n`);
    
    if (options.verbose) {
        console.log('Files to run:');
        suite.files.forEach(file => console.log(`  - ${file}`));
        console.log('');
    }
    
    // Build Jest command
    const testPath = join(__dirname, '..', '..', '..');
    const testFiles = suite.files.map(file => join('src/attacks/tests', file));
    
    // Build npm test command arguments
    const npmArgs = ['run', 'test', '--'];
    
    // Add test files
    npmArgs.push(...testFiles);
    
    // Add coverage if requested
    if (options.coverage) {
        npmArgs.push('--coverage');
    } else {
        npmArgs.push('--no-coverage');
    }
    
    // Add verbose if requested
    if (options.verbose) {
        npmArgs.push('--verbose');
    }
    
    // Run Jest via npm
    const jestProcess = spawn('npm', npmArgs, {
        cwd: testPath,
        stdio: 'inherit',
        shell: true
    });
    
    jestProcess.on('close', (code) => {
        if (code === 0) {
            console.log(`\n✅ Test suite "${suiteName}" completed successfully!\n`);
        } else {
            console.error(`\n❌ Test suite "${suiteName}" failed with exit code ${code}\n`);
            process.exit(code);
        }
    });
    
    jestProcess.on('error', (error) => {
        console.error(`\n❌ Error running tests: ${error.message}\n`);
        process.exit(1);
    });
}

// Main
function main() {
    const options = parseArgs();
    
    if (options.help || !options.suite) {
        showHelp();
        if (!options.suite) {
            process.exit(1);
        }
        return;
    }
    
    runTests(options.suite, options);
}

main();

