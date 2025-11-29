import { Orchestrator } from '../../orchestrator.js';
import Shift from '../../../ciphers/shift/shift.js';
import {
    createDictionaryValidationTest,
    verifyOrchestratorResult,
    setupOrchestratorTests
} from './orchestrator-test-base.js';

describe('Orchestrator with Dictionary Validation', () => {
    // Setup dictionaries before tests
    beforeAll(async () => {
        await setupOrchestratorTests();
    }, 30000);

    createDictionaryValidationTest(
        'should validate Caesar cipher result with dictionary',
        (plaintext) => {
            const caesar = new Shift.CaesarShift(plaintext, 7);
            return caesar.encode();
        },
        'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
        {
            timeout: 60000,
            orchestratorOptions: {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 30000
            }
        }
    );
    
    createDictionaryValidationTest(
        'should validate longer text with dictionary',
        (plaintext) => {
            const caesar = new Shift.CaesarShift(plaintext, 3);
            return caesar.encode();
        },
        'IN CRYPTOGRAPHY A SUBSTITUTION CIPHER IS A METHOD OF ENCRYPTING BY WHICH UNITS OF PLAINTEXT ARE REPLACED WITH CIPHERTEXT',
        {
            timeout: 120000,
            orchestratorOptions: {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 60000
            }
        }
    );
    
    it('should handle dictionary validation gracefully when dictionaries are unavailable', async () => {
        const plaintext = 'HELLO WORLD';
        const caesar = new Shift.CaesarShift(plaintext, 5);
        const ciphertext = caesar.encode();
        
        const orchestrator = new Orchestrator('english');
        const result = await orchestrator.autoDecrypt(ciphertext, {
            tryMultiple: false,
            useDictionary: false, // Disable dictionary
            maxTime: 10000
        });
        
        verifyOrchestratorResult(result, {
            requireScore: false
        });
    }, 30000);
});

