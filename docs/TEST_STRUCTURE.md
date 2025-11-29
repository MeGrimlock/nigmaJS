# Test Structure Documentation

This document explains the organization and purpose of the test files in the NigmaJS project.

## Overview

The test suite is organized into several categories, each serving a specific purpose:

1. **Phase 2 Tests**: Comprehensive cipher detection and validation tests
2. **Orchestrator Tests**: Tests for the main orchestrator functionality
3. **Solver Tests**: Tests for individual solver implementations
4. **Benchmark Tests**: Performance and accuracy benchmarks

## Why Multiple Test Files?

Instead of having a single monolithic test file, we use multiple focused test files because:

1. **Separation of Concerns**: Each file tests a specific aspect of the system
2. **Maintainability**: Easier to find and fix issues in specific areas
3. **Performance**: Can run only the tests you need, saving time
4. **Clarity**: Clear organization makes it obvious what each test covers
5. **Parallel Execution**: Jest can run different test files in parallel
6. **Selective Testing**: Run only relevant tests during development

## Phase 2 Tests

**Purpose**: Validate that the orchestrator can correctly detect cipher types, analyze IC (Index of Coincidence), detect languages, and successfully decrypt messages across all supported languages and cipher methods.

**Files**:
- `phase2-english.test.js` - Tests for English language
- `phase2-spanish.test.js` - Tests for Spanish language
- `phase2-french.test.js` - Tests for French language
- `phase2-italian.test.js` - Tests for Italian language
- `phase2-portuguese.test.js` - Tests for Portuguese language
- `phase2-german.test.js` - Tests for German language

**Why Separate by Language?**
- Each language has different letter frequencies, IC values, and dictionary validation
- Tests can be run independently for faster feedback during development
- Easier to identify language-specific issues
- Can focus on a specific language when debugging

**What They Test**:
- Cipher type detection (Caesar, Vigenère, Substitution, Transposition, etc.)
- IC (Index of Coincidence) analysis accuracy
- Language detection accuracy
- Decryption success rate
- Confidence scoring

**Base File**: `phase2-test-base.js` - Contains common test logic shared by all language-specific tests

**Helper File**: `phase2-test-helpers.js` - Contains utility functions for analysis and validation

## Orchestrator Tests

The orchestrator tests are divided into several files based on their scope and purpose:

### 1. `orchestrator.test.js` - Basic Functionality

**Purpose**: Test core orchestrator functionality with simple, focused test cases.

**What It Tests**:
- Basic cipher detection (Caesar, Vigenère, Substitution)
- Decryption with known language
- Progress tracking via generator
- Multiple strategy execution

**When to Use**: Quick validation of core functionality, CI/CD smoke tests

### 2. `orchestrator-comprehensive.test.js` - Comprehensive Coverage

**Purpose**: Test orchestrator across multiple ciphers, languages, text lengths, and edge cases.

**What It Tests**:
- Multiple cipher types (Caesar, ROT13, Vigenère, Substitution, Beaufort, Porta, Gronsfeld, Quagmire)
- Multiple languages (English, Spanish, French, German, Italian, Portuguese)
- Different text lengths (short, medium, long)
- Edge cases (numbers, punctuation, mixed case, very short texts)
- Performance benchmarks
- Multi-language detection

**When to Use**: Full regression testing, before releases, comprehensive validation

### 3. `orchestrator-e2e.test.js` - End-to-End Tests

**Purpose**: Test complete workflow: automatic language detection → cipher detection → decryption.

**What It Tests**:
- Automatic language detection (Spanish/English)
- Cipher type detection accuracy
- Complete decryption workflow
- Result validation (plaintext matches original)
- Confidence scoring

**When to Use**: Validate that the complete system works together, integration testing

### 4. `orchestrator-comprehensive-e2e.test.js` - Strict E2E Validation

**Purpose**: Comprehensive E2E tests with strict validation requirements.

**What It Tests**:
- All E2E scenarios with stricter requirements
- Minimum confidence thresholds (0.7+)
- Exact plaintext matching
- Multiple cipher types (ROT47, Vigenère, Porta, Quagmire)
- Both Spanish and English

**When to Use**: Pre-release validation, quality assurance, acceptance testing

### 5. `orchestrator-dictionary.test.js` - Dictionary Validation

**Purpose**: Test dictionary-based validation and ranking of decryption results.

**What It Tests**:
- Dictionary validation integration
- Result ranking by dictionary score
- Dictionary validation metrics
- Optional dictionary validation (can be disabled)
- Graceful handling when dictionaries are unavailable

**When to Use**: Validate dictionary integration, test dictionary-based improvements

**Base File**: `orchestrator-test-base.js` - Contains common test utilities and helper functions

## Solver Tests

### `hmm-solver.test.js`

**Purpose**: Test the Hidden Markov Model (HMM) solver for substitution ciphers.

**What It Tests**:
- HMM-based decryption accuracy
- Key recovery
- Performance with different text lengths

### `polyalphabetic-solver.test.js`

**Purpose**: Test the polyalphabetic cipher solver (Vigenère, Beaufort, etc.).

**What It Tests**:
- Key length detection
- Key recovery
- Multiple polyalphabetic cipher variants

## Benchmark Tests

### `decryption-benchmark.test.js`

**Purpose**: Performance and accuracy benchmarks.

**What It Tests**:
- Decryption speed
- Accuracy metrics
- Comparison between different methods

## Test Execution

### Using the Test Runner Script

The `run-tests.js` script provides a unified way to run test suites:

```bash
# Run all Phase 2 tests
node src/attacks/tests/run-tests.js --suite phase2-all

# Run Phase 2 tests for a specific language
node src/attacks/tests/run-tests.js --suite phase2-english

# Run all orchestrator tests
node src/attacks/tests/run-tests.js --suite orchestrator-all

# Run specific orchestrator test suite
node src/attacks/tests/run-tests.js --suite orchestrator-e2e

# Run with verbose output
node src/attacks/tests/run-tests.js --suite phase2-all --verbose

# Run with coverage
node src/attacks/tests/run-tests.js --suite orchestrator-all --coverage
```

### Using Jest Directly

You can also run tests directly with Jest:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/attacks/tests/orchestrator.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="Caesar"

# Run with coverage
npm test -- --coverage
```

## Test File Dependencies

```
orchestrator-test-base.js (shared utilities)
├── orchestrator.test.js
├── orchestrator-comprehensive.test.js
├── orchestrator-e2e.test.js
├── orchestrator-comprehensive-e2e.test.js
└── orchestrator-dictionary.test.js

phase2-test-base.js (shared test logic)
├── phase2-test-helpers.js (shared utilities)
├── phase2-english.test.js
├── phase2-spanish.test.js
├── phase2-french.test.js
├── phase2-italian.test.js
├── phase2-portuguese.test.js
└── phase2-german.test.js
```

## Best Practices

1. **During Development**: Run only the relevant test file for what you're working on
2. **Before Committing**: Run the full test suite (`--suite all`)
3. **CI/CD**: Run comprehensive tests (`orchestrator-comprehensive`, `phase2-all`)
4. **Debugging**: Run specific language or cipher tests to isolate issues
5. **Performance Testing**: Use benchmark tests to measure improvements

## Adding New Tests

When adding new tests:

1. **Use Base Files**: Leverage `orchestrator-test-base.js` or `phase2-test-base.js` for common functionality
2. **Follow Naming**: Use descriptive names that indicate what the test covers
3. **Group Related Tests**: Keep related tests in the same file
4. **Document Purpose**: Add comments explaining what the test validates
5. **Update This Doc**: Add new test files to this documentation

## Test Coverage Goals

- **Phase 2 Tests**: 100% coverage of all cipher types × all languages × all text lengths
- **Orchestrator Tests**: 100% coverage of orchestrator functionality
- **Solver Tests**: 100% coverage of solver implementations
- **E2E Tests**: Critical paths and user workflows

## Troubleshooting

**Tests are slow?**
- Run only the specific test file you need
- Use `--suite` to run a subset of tests
- Check if you can optimize the test itself

**Tests failing?**
- Run with `--verbose` to see detailed output
- Check the specific test file's documentation
- Review the roadmap files generated by Phase 2 tests

**Need to test a specific scenario?**
- Create a focused test in the appropriate file
- Or use the test runner with a specific suite

