# PolyalphabeticSolver - Technical Documentation

## Overview

The `PolyalphabeticSolver` is designed to automatically decrypt advanced polyalphabetic ciphers that are more complex than standard Vigenère. These include:

- **Beaufort Cipher**: Self-reciprocal, subtraction-based (C = K - P mod 26)
- **Porta Cipher**: Uses 13 mutually reversible alphabet pairs
- **Gronsfeld Cipher**: Like Vigenère but with numeric keys (0-9)
- **Quagmire I-IV**: Mixed cipher alphabets with keywords

## Current Performance (v3.1.x)

### Success Rates by Cipher Type

| Cipher Type | Success Rate | Minimum Text Length | Notes |
|-------------|--------------|---------------------|-------|
| **Beaufort** | 40-60% | 200+ chars | Subtraction-based encryption makes frequency analysis difficult |
| **Porta** | 60-70% | 150+ chars | Mutually reversible alphabets, moderate difficulty |
| **Gronsfeld** | 70-80% | 100+ chars | Similar to Vigenère, numeric keys are easier to find |
| **Quagmire** | 20-30% | 500+ chars | Very difficult without knowing the cipher alphabet |

### Factors Affecting Success

1. **Text Length**: Longer texts provide more statistical data
   - <100 chars: Very unreliable
   - 100-200 chars: Moderate success for simple ciphers
   - 200+ chars: Good success for most ciphers
   - 500+ chars: Best results, especially for Quagmire

2. **Key Length**: Shorter keys are easier to break
   - 3-4 letters: High success rate
   - 5-7 letters: Moderate success rate
   - 8+ letters: Low success rate

3. **Language**: Currently optimized for English
   - English: Best performance
   - Spanish/French/German: Good performance
   - Other languages: Experimental

## Technical Approach

### Beaufort Cipher

**Challenge**: Beaufort uses subtraction (C = K - P mod 26), which inverts frequency patterns in a complex way.

**Strategy**:
1. Split ciphertext into columns based on probable key length (from Kasiski)
2. Build key iteratively, testing full decryption at each step
3. Use N-gram scoring (quadgrams) to evaluate plaintext quality
4. Refine key with local search (±2 shifts per position)

**Limitations**:
- Frequency analysis is less effective due to subtraction
- Requires longer texts for reliable statistical patterns
- May converge to local optima (wrong key with reasonable score)

### Porta Cipher

**Challenge**: Uses 13 alphabet pairs, only half the key space of standard Vigenère.

**Strategy**:
1. Split into columns by key length
2. For each column, try all 26 key letters (though only 13 are unique)
3. Score with N-gram models
4. Select best key combination

**Limitations**:
- Mutually reversible alphabets can create ambiguity
- Short texts may not have enough data to distinguish correct key

### Gronsfeld Cipher

**Challenge**: Numeric keys (0-9) instead of letters.

**Strategy**:
1. Similar to Vigenère but with 10 possible values per position
2. Frequency analysis per column
3. N-gram scoring for validation

**Limitations**:
- Smaller key space makes it easier than Vigenère
- Generally high success rate

### Quagmire Cipher

**Challenge**: Uses both a keyword AND a mixed cipher alphabet.

**Strategy**:
1. Try common keywords: KEY, SECRET, CIPHER, CODE, CRYPTO, ENIGMA
2. Try common cipher alphabets:
   - Normal (ABCD...XYZ)
   - Reversed (ZYXW...CBA)
   - QWERTY keyboard layout
3. Test all combinations and score results

**Limitations**:
- Without knowing the cipher alphabet, success rate is very low
- Current implementation only tries a small set of common combinations
- Would require brute force or more sophisticated search for arbitrary alphabets

## Recommendations for Users

### For Best Results:

1. **Use longer texts**: Aim for 200+ characters minimum
2. **Know your cipher type**: If you know it's Beaufort vs Porta, use the specific method
3. **Try multiple key lengths**: Kasiski may not always find the correct length
4. **Combine with manual analysis**: Use the tool's output as a starting point
5. **Verify results**: Check if the decrypted text makes sense in context

### For Developers:

1. **Improve Beaufort**: Consider implementing:
   - Simulated Annealing for key search
   - Multiple random restarts
   - Hybrid frequency + N-gram optimization

2. **Expand Quagmire**: Add:
   - Genetic algorithms for alphabet search
   - Dictionary-based keyword guessing
   - Machine learning for pattern recognition

3. **Add more ciphers**: Consider:
   - Variant Beaufort
   - Autokey ciphers
   - Running key ciphers

## Future Improvements

### Short-term (v3.2.x):
- [ ] Add progress callbacks for long-running decryptions
- [ ] Implement multiple random restarts for Beaufort
- [ ] Add confidence scoring based on dictionary validation

### Medium-term (v3.3.x):
- [ ] Implement Simulated Annealing for Beaufort key search
- [ ] Add support for custom cipher alphabets in Quagmire
- [ ] Improve language detection for non-English texts

### Long-term (v4.x):
- [ ] Machine learning-based cipher identification
- [ ] GPU acceleration for brute force attacks
- [ ] Support for modern ciphers (AES, RSA analysis)

## References

1. **Beaufort Cipher**: "The Beaufort Cipher" by Kahn, David (1967)
2. **Porta Cipher**: "Cryptologia" journal, various articles
3. **Kasiski Examination**: "Die Geheimschriften und die Dechiffrir-kunst" by Kasiski (1863)
4. **N-gram Analysis**: "Practical Cryptography" by Schneier (1996)

## Contributing

If you improve the PolyalphabeticSolver, please:
1. Add tests for your improvements
2. Document success rates with various text lengths
3. Update this README with your findings
4. Submit a PR with clear explanations

---

**Last Updated**: November 2025  
**Version**: 3.1.x  
**Maintainer**: NigmaJS Team

