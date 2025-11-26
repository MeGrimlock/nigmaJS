# Cryptanalysis in NigmaJS

This document provides detailed technical information about the cryptanalysis capabilities of NigmaJS.

## Table of Contents

1. [Orchestrator Architecture](#orchestrator-architecture)
2. [Language Detection](#language-detection)
3. [Cipher Detection](#cipher-detection)
4. [Attack Strategies](#attack-strategies)
5. [Dictionary Validation](#dictionary-validation)
6. [Statistical Analysis](#statistical-analysis)
7. [Multi-Language Strategy](#multi-language-strategy)

## Orchestrator Architecture

The `Orchestrator` is the central coordinator for automated cryptanalysis. It follows a modular design based on SOLID principles:

### Components

#### 1. LanguageHandler
- **Purpose**: Manages language detection and dictionary loading
- **Methods**:
  - `detectLanguage(ciphertext, autoDetect, fallbackLanguage)`: Detects the most probable languages
  - `loadDictionary(language, basePath)`: Loads language-specific dictionaries

#### 2. StrategySelector
- **Purpose**: Selects appropriate attack strategies based on cipher type
- **Logic**: Analyzes detected cipher type and text characteristics to choose optimal strategies
- **Output**: Array of strategy objects with `{ name, execute }` methods

#### 3. ResultValidator
- **Purpose**: Validates decryption results using dictionary-based metrics
- **Methods**:
  - `validateResult(result, language)`: Validates a decryption result
  - `isExcellentResult(result)`: Checks if result meets high-confidence criteria

#### 4. Strategy Classes
Individual attack implementations located in `src/attacks/strategies/`:
- `CaesarBruteForce`: Brute force for Caesar/ROT13
- `ROT47BruteForce`: Brute force for ROT47 (printable ASCII)
- `VigenereSolver`: Vigenère cipher solver
- `PolyalphabeticSolver`: Handles Beaufort, Porta, Gronsfeld, Quagmire variants
- `AtbashSolver`: Atbash transformation solver
- `AutokeySolver`: Autokey cipher solver
- `BaconianSolver`: Baconian cipher decoder
- `PolybiusSolver`: Polybius Square decoder
- `SubstitutionStrategy`: Wrapper for Hill Climbing / Simulated Annealing

### Workflow

```
1. Language Detection (if auto-detection enabled)
   └─> Returns top 5 language candidates

2. Cipher Type Detection
   └─> Uses CipherIdentifier with statistical analysis

3. Strategy Selection
   └─> StrategySelector chooses appropriate attacks

4. Multi-Language Execution
   ├─> For each language candidate:
   │   ├─> Load language dictionary
   │   ├─> Execute all selected strategies
   │   ├─> Validate results with dictionary
   │   └─> Score results (confidence + dictionary metrics)
   └─> Select best result across all languages

5. Result Validation
   └─> Dictionary validation + confidence scoring
```

## Language Detection

### N-gram Analysis

Language detection uses **quadgram (4-gram) frequency analysis**:

1. **Extract quadgrams** from the ciphertext
2. **Compare frequencies** against language models
3. **Calculate identity score** (lower = better match)
4. **Rank languages** by identity score

### Supported Languages

| Language | Dictionary Size | N-gram Model |
|----------|----------------|--------------|
| English  | 275,000+ words | Quadgrams    |
| Spanish  | 636,000+ words | Quadgrams    |
| Italian  | 17,000+ words  | Quadgrams    |
| French   | 319,000+ words | Quadgrams    |
| Portuguese| 182,000+ words| Quadgrams    |
| German   | 66,000+ words  | Quadgrams    |

### Detection Algorithm

```javascript
// Simplified algorithm
function detectLanguage(text) {
    const quadgrams = extractQuadgrams(text);
    const scores = [];
    
    for (const language of supportedLanguages) {
        const model = loadLanguageModel(language);
        const identityScore = calculateIdentityScore(quadgrams, model);
        scores.push({ language, identityScore });
    }
    
    return scores.sort((a, b) => a.identityScore - b.identityScore);
}
```

## Cipher Detection

### Statistical Fingerprinting

The `CipherIdentifier` uses multiple statistical metrics to identify cipher types:

#### 1. Index of Coincidence (IC)

- **Caesar/Simple Substitution**: IC ≈ 1.73 (English)
- **Vigenère**: IC ≈ 1.0-1.5 (depends on key length)
- **Random Text**: IC ≈ 1.0

#### 2. Chi-squared Test

Compares observed letter frequencies against expected language frequencies:

```
χ² = Σ (observed - expected)² / expected
```

Lower chi-squared = closer match to language frequencies

#### 3. Entropy

Measures randomness in the ciphertext:

- **Plaintext**: ~4.0 bits/character (English)
- **Caesar/Substitution**: ~4.0 bits/character
- **Vigenère**: ~3.5-4.0 bits/character
- **Random**: ~4.7 bits/character

#### 4. Kasiski Examination

Detects repeating patterns for polyalphabetic ciphers:

- Finds repeated trigrams
- Calculates distances between repetitions
- Suggests key length (GCD of distances)

#### 5. Pattern Analysis

- **Number pairs**: Suggests Polybius Square
- **A/B patterns**: Suggests Baconian cipher
- **Printable ASCII**: Suggests ROT47

### Detection Confidence

Each detected cipher type includes a confidence score (0-1):
- **> 0.8**: High confidence
- **0.5-0.8**: Medium confidence
- **< 0.5**: Low confidence

## Attack Strategies

### Shift Ciphers

#### Caesar Brute Force
- Tries all 26 possible shifts
- Scores each result using quadgram analysis
- Returns highest-scoring result

#### ROT47 Brute Force
- Tries all 94 printable ASCII shifts
- Validates across multiple languages
- Handles mixed alphanumeric text

#### Atbash Solver
- Direct transformation (A↔Z, B↔Y, etc.)
- Validates with dictionary
- Fast single-pass operation

### Vigenère-like Ciphers

#### Vigenère Solver
1. **Friedman Test**: Estimates key length
2. **Frequency Analysis**: Per column (assuming key length)
3. **Key Recovery**: Finds most probable key per column
4. **Validation**: Dictionary validation of decrypted text

#### Polyalphabetic Solver
Handles multiple variants:
- **Beaufort**: Reverse Vigenère
- **Porta**: Symmetric digraph substitution
- **Gronsfeld**: Numeric key variant
- **Quagmire I-IV**: Complex keyword-based variants

### Substitution Ciphers

#### Hill Climbing
1. Start with random substitution key
2. Iteratively swap pairs of letters
3. Accept swaps that improve quadgram score
4. Continue until no improvement found

#### Simulated Annealing
1. Start with random substitution key
2. Make random swaps
3. Accept better swaps, probabilistically accept worse swaps
4. Gradually reduce "temperature" (acceptance probability)
5. Converge to optimal solution

### Dictionary-based Ciphers

#### Baconian Solver
- Detects A/B or 0/1 patterns
- Decodes binary patterns to letters
- Validates with dictionary

#### Polybius Solver
- Detects number pairs (11-55)
- Tries decoding with/without keywords
- Validates results

#### Autokey Solver
- Tries common keys
- Validates partial decryptions
- Uses dictionary to guide key search

## Dictionary Validation

### Metrics

The `DictionaryValidator` provides comprehensive validation metrics:

#### Word Coverage
Percentage of characters in valid dictionary words:
```
wordCoverage = (validChars / totalChars) × 100
```

#### Character Coverage
Percentage of characters covered by valid words:
```
charCoverage = (charsInValidWords / totalChars) × 100
```

#### Confidence Score
Combined metric (0-1):
```
confidence = (wordCoverage × 0.4) + (charCoverage × 0.3) + (avgWordLength × 0.2) + (vocabRichness × 0.1)
```

### Validation Levels

- **VALID** (confidence > 0.7): High confidence, likely correct
- **UNCERTAIN** (confidence 0.4-0.7): Medium confidence, may need review
- **INVALID** (confidence < 0.4): Low confidence, likely incorrect

## Statistical Analysis

### Index of Coincidence (IC)

Measures letter frequency distribution:

```
IC = (Σ n_i × (n_i - 1)) / (N × (N - 1))
```

Where:
- `n_i` = frequency of letter i
- `N` = total number of letters

**Expected Values:**
- English plaintext: ~1.73
- Random text: ~1.0
- Vigenère (key length k): ~1.0 + (0.73/k)

### Chi-squared Test

Measures deviation from expected frequencies:

```
χ² = Σ (observed_i - expected_i)² / expected_i
```

Lower values indicate better match to language model.

### Entropy

Measures information content:

```
H = -Σ p_i × log₂(p_i)
```

Where `p_i` is the probability of character i.

## Multi-Language Strategy

### Exhaustive Search Approach

The Orchestrator implements an **exhaustive multi-language strategy**:

1. **Detect Top 5 Languages**: Identify most probable languages
2. **For Each Language**:
   - Load language-specific dictionary
   - Execute ALL selected attack strategies
   - Validate results with language dictionary
   - Score results: `confidence + (wordCoverage × 0.5) + (dictConfidence × 0.3)`
3. **Early Termination**: Stop if excellent result found (confidence > 0.9 AND wordCoverage > 0.8)
4. **Select Best**: Return highest-scoring result across all languages

### Why This Works

- **Language-specific validation**: Each language has unique word patterns
- **Exhaustive search**: Ensures we try all possibilities
- **Combined scoring**: Balances statistical confidence with dictionary validation
- **Early termination**: Saves time when high-confidence result is found

### Example Flow

```
Ciphertext: "KHOOR ZRUOG"

1. Language Detection:
   - English: 0.95 confidence
   - Spanish: 0.02 confidence
   - ...

2. Cipher Detection:
   - Caesar-shift: 0.89 confidence

3. Strategy Selection:
   - CaesarBruteForce
   - AtbashSolver

4. Execution (English):
   - CaesarBruteForce: "HELLO WORLD" (confidence: 0.95, wordCoverage: 100%)
   - AtbashSolver: "SVOOL DLIOW" (confidence: 0.1, wordCoverage: 0%)

5. Result:
   - Plaintext: "HELLO WORLD"
   - Method: "caesar-brute-force"
   - Confidence: 0.95
   - Dictionary Validation: VALID
```

## Performance Considerations

### Time Complexity

- **Caesar Brute Force**: O(26 × n) where n = text length
- **Vigenère Solver**: O(k × n) where k = key length, n = text length
- **Hill Climbing**: O(iterations × n) typically 1000-10000 iterations
- **Dictionary Validation**: O(m × w) where m = words, w = average word length

### Optimization Strategies

1. **Early Termination**: Stop when excellent result found
2. **Language Prioritization**: Try most probable languages first
3. **Dictionary Caching**: Cache loaded dictionaries
4. **Parallel Execution**: Execute strategies in parallel (future enhancement)

## References

- Jakobsen, T. (1995). "A Fast Method for the Cryptanalysis of Substitution Ciphers"
- Gaines, H. F. "Cryptanalysis: A Study of Ciphers and Their Solution"
- Friedman, W. F. "The Index of Coincidence and Its Applications in Cryptography"
- Kasiski, F. W. "Die Geheimschriften und die Dechiffrir-Kunst"

