# Scripts Directory

This directory contains various scripts for development, testing, and validation of the NigmaJS library.

## Directory Structure

```
scripts/
├── debug/          # Debugging and diagnostic scripts
├── tests/          # Standalone test scripts
├── validate/       # Validation and verification scripts
├── extract-dictionaries.js    # Dictionary extraction utility
└── update-version.js         # Version management script
```

### debug/
- `debug-build.js` - Build process debugging
- `debug-cipher-identifier.js` - Cipher identification debugging
- `debug-decrypt.js` - Decryption process debugging
- `debug-frequency.js` - Frequency analysis debugging
- `debug-hmm-init.js` - HMM initialization debugging
- `debug-key-length.js` - Key length analysis debugging
- `debug-orchestrator.js` - Orchestrator debugging
- `debug-test.js` - General test debugging
- `debug-tests.js` - Test suite debugging
- `debug-vigenere.js` - Vigenère cipher debugging
- `diagnose-vigenere.js` - Vigenère diagnosis tools
- `hmm-test-results.log` - HMM test results log

### tests/
- `manual-vigenere-test.js` - Manual Vigenère testing
- `run-and-check.js` - Run and check utilities
- `run-hmm-tests.js` - HMM test runner
- `simple-rot-test.js` - Simple ROT cipher tests
- `simple-test.js` - Basic functionality tests
- `smoke-test.js` - Smoke tests
- `test_porta.js` - Porta cipher tests
- `test-advanced-periodic.js` - Advanced periodic analysis tests
- `test-atbash-cipher.js` - Atbash cipher tests
- `test-attacks-config.js` - Attack configuration tests
- `test-decrypt.js` - Decryption tests
- `test-exports.js` - Export/import tests
- `test-final.js` - Final integration tests
- `test-fix-verification.js` - Fix verification tests
- `test-identifier-fix.js` - Identifier fix tests
- `test-imports.js` - Import/export tests
- `test-minimal.js` - Minimal functionality tests
- `test-null-input.js` - Null input handling tests
- `test-rot.js` - ROT cipher tests
- `test-simple.js` - Simple cipher tests
- `test-subset.js` - Test subset runner
- `test-vigenere-fix.js` - Vigenère fix tests
- `test-vigenere-fixes.js` - Multiple Vigenère fixes tests

### validate/
- `validate-base-data.js` - Base data validation
- `validate-config.js` - Configuration validation
- `validate-dictionaries.js` - Dictionary validation
- `verify-attacks-fix.js` - Attack fixes verification
- `verify-cipher.js` - Cipher verification

## Categories

### debug/
Scripts for debugging specific issues, performance analysis, and diagnostic tools.
These are typically created during development to troubleshoot specific problems.

### tests/
Standalone test scripts that can be run independently of the Jest test suite.
These include manual tests, integration tests, and specific scenario validations.

### validate/
Scripts for validating configurations, data integrity, and system verification.
Used to ensure data quality and system consistency.

## Usage

Most scripts can be run with:
```bash
node scripts/<category>/<script-name>.js
```

Some scripts may require additional setup or dependencies. Check individual script headers for usage instructions.
