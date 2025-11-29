# Test Suite - Quick Reference

## Quick Start

### Run Tests with Parameters

```bash
# Using the test runner script
node src/attacks/tests/run-tests.js --suite <suite-name> [options]

# Or using npm (shorter)
npm run test:run -- --suite <suite-name> [options]
```

### Examples

```bash
# Run all Phase 2 tests
npm run test:run -- --suite phase2-all

# Run Phase 2 tests for English only
npm run test:run -- --suite phase2-english

# Run all orchestrator tests
npm run test:run -- --suite orchestrator-all

# Run with verbose output
npm run test:run -- --suite orchestrator-e2e --verbose

# Run with coverage report
npm run test:run -- --suite phase2-all --coverage
```

## Available Test Suites

### Phase 2 Tests (Cipher Detection & Validation)

| Suite | Description |
|-------|-------------|
| `phase2-all` | Run all Phase 2 tests (all languages) |
| `phase2-english` | Phase 2 tests for English |
| `phase2-spanish` | Phase 2 tests for Spanish |
| `phase2-french` | Phase 2 tests for French |
| `phase2-italian` | Phase 2 tests for Italian |
| `phase2-portuguese` | Phase 2 tests for Portuguese |
| `phase2-german` | Phase 2 tests for German |

### Orchestrator Tests

| Suite | Description |
|-------|-------------|
| `orchestrator-all` | Run all orchestrator tests |
| `orchestrator-basic` | Basic orchestrator functionality |
| `orchestrator-comprehensive` | Comprehensive tests (multiple ciphers/languages) |
| `orchestrator-e2e` | End-to-end tests (language + cipher + decryption) |
| `orchestrator-comprehensive-e2e` | Comprehensive E2E with strict validation |
| `orchestrator-dictionary` | Dictionary validation tests |

### Other

| Suite | Description |
|-------|-------------|
| `all` | Run all test suites |

## Options

- `--suite <name>` - Test suite to run (required)
- `--verbose, -v` - Enable verbose output
- `--coverage, -c` - Generate coverage report
- `--help, -h` - Show help message

## Understanding Test Files

### Why Multiple Files?

Each test file has a specific purpose:

- **Phase 2 Tests**: Validate cipher detection, IC analysis, and decryption across all languages
- **Orchestrator Tests**: Test the main orchestrator with different scopes:
  - `orchestrator.test.js` - Basic functionality
  - `orchestrator-comprehensive.test.js` - Full coverage
  - `orchestrator-e2e.test.js` - Complete workflows
  - `orchestrator-dictionary.test.js` - Dictionary integration

### Test File Organization

```
src/attacks/tests/
├── orchestrator-test-base.js      # Shared utilities for orchestrator tests
├── phase2-test-base.js             # Shared logic for Phase 2 tests
├── phase2-test-helpers.js          # Helper functions for Phase 2
│
├── orchestrator.test.js             # Basic orchestrator tests
├── orchestrator-comprehensive.test.js  # Comprehensive orchestrator tests
├── orchestrator-e2e.test.js        # E2E orchestrator tests
├── orchestrator-comprehensive-e2e.test.js  # Strict E2E tests
├── orchestrator-dictionary.test.js # Dictionary validation tests
│
├── phase2-english.test.js          # Phase 2: English
├── phase2-spanish.test.js          # Phase 2: Spanish
├── phase2-french.test.js           # Phase 2: French
├── phase2-italian.test.js          # Phase 2: Italian
├── phase2-portuguese.test.js       # Phase 2: Portuguese
├── phase2-german.test.js           # Phase 2: German
│
├── hmm-solver.test.js              # HMM solver tests
├── polyalphabetic-solver.test.js   # Polyalphabetic solver tests
└── decryption-benchmark.test.js    # Performance benchmarks
```

## Detailed Documentation

For complete documentation about each test file, see:
- **[TEST_STRUCTURE.md](../../docs/TEST_STRUCTURE.md)** - Complete test structure documentation

## Common Workflows

### During Development
```bash
# Run only the tests relevant to what you're working on
npm run test:run -- --suite phase2-english
npm run test:run -- --suite orchestrator-basic
```

### Before Committing
```bash
# Run comprehensive tests
npm run test:run -- --suite orchestrator-comprehensive
npm run test:run -- --suite phase2-all
```

### CI/CD Pipeline
```bash
# Run all tests with coverage
npm run test:run -- --suite all --coverage
```

### Debugging
```bash
# Run with verbose output to see detailed logs
npm run test:run -- --suite phase2-english --verbose
```

## Direct Jest Usage

You can also run tests directly with Jest:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/attacks/tests/orchestrator.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="Caesar"
```

## Need Help?

```bash
# Show help message
npm run test:run -- --help
```

