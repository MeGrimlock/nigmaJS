# Phase 2: Cipher Detection Improvements - Roadmap (english)

Generated: 2025-11-28T21:52:20.533Z

Total Issues: 20

## CIPHER TYPE DETECTION

**Count:** 20

### Vigenere - short

- **Plaintext Length:** 43 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.95
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.95)
  - IC: 0.7865546218487395
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.95
  - Language Detected: english

### Vigenere - medium

- **Plaintext Length:** 148 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.8
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.8)
  - IC: 1.201032258064516
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.8
  - Language Detected: english

### Vigenere - long

- **Plaintext Length:** 388 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.95
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.95)
  - IC: 1.2170494667491718
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.95
  - Language Detected: english

### Beaufort - short

- **Plaintext Length:** 43 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.95
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.95)
  - IC: 1.0487394957983194
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.95
  - Language Detected: english

### Beaufort - medium

- **Plaintext Length:** 148 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.8
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.8)
  - IC: 1.1138064516129031
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.8
  - Language Detected: english

### Beaufort - long

- **Plaintext Length:** 388 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.8
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.8)
  - IC: 1.2033269027772722
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.8
  - Language Detected: english

### Porta - short

- **Plaintext Length:** 43 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 1
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 1)
  - IC: 0.7865546218487395
  - Decryption: SUCCESS
  - Method: hill-climbing
  - Confidence: 1
  - Language Detected: english

### Porta - medium

- **Plaintext Length:** 148 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.8
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.8)
  - IC: 1.080258064516129
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.8
  - Language Detected: english

### Porta - long

- **Plaintext Length:** 388 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.95
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.95)
  - IC: 1.1465438794452736
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.95
  - Language Detected: english

### Gronsfeld - short

- **Plaintext Length:** 43 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.95
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.95)
  - IC: 1.092436974789916
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.95
  - Language Detected: english

### Gronsfeld - medium

- **Plaintext Length:** 148 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.8
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.8)
  - IC: 1.0433548387096774
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.8
  - Language Detected: english

### Gronsfeld - long

- **Plaintext Length:** 388 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.95
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.95)
  - IC: 1.0944927747242748
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.95
  - Language Detected: english

### Autokey - short

- **Plaintext Length:** 43 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.98
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.98)
  - IC: 0.9176470588235294
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.98
  - Language Detected: english

### Autokey - medium

- **Plaintext Length:** 148 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.98
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.98)
  - IC: 1.2245161290322581
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.98
  - Language Detected: english

### Autokey - long

- **Plaintext Length:** 388 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "vigenere-like",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.5
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.5)
  - IC: 1.0731991409747752
  - Decryption: SUCCESS
  - Method: autokey
  - Confidence: 0.5
  - Language Detected: english

### SimpleSubstitution - long

- **Plaintext Length:** 388 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "monoalphabetic-substitution",
  "actual": "transposition",
  "confidence": 0.85
}
- **Analysis:**
  - Detected Type: transposition (confidence: 0.85)
  - IC: 1.8109052524296583
  - Decryption: SUCCESS
  - Method: amsco
  - Confidence: 0.85
  - Language Detected: english

### RailFence - short

- **Plaintext Length:** 43 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "transposition",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.98
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.98)
  - IC: 0.5680672268907563
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.98
  - Language Detected: english

### RailFence - medium

- **Plaintext Length:** 148 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "transposition",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.98
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.98)
  - IC: 1.4727741935483871
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.98
  - Language Detected: english

### Amsco - short

- **Plaintext Length:** 43 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "transposition",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.98
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.98)
  - IC: 0.5680672268907563
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.98
  - Language Detected: english

### Amsco - medium

- **Plaintext Length:** 148 chars
- **Issue Details:** {
  "type": "cipher_type_detection",
  "expected": "transposition",
  "actual": "monoalphabetic-substitution",
  "confidence": 0.98
}
- **Analysis:**
  - Detected Type: monoalphabetic-substitution (confidence: 0.98)
  - IC: 1.4727741935483871
  - Decryption: SUCCESS
  - Method: caesar-shift
  - Confidence: 0.98
  - Language Detected: english

## Summary Statistics

### By Cipher
- Vigenere: 3 issues
- Beaufort: 3 issues
- Porta: 3 issues
- Gronsfeld: 3 issues
- Autokey: 3 issues
- RailFence: 2 issues
- Amsco: 2 issues
- SimpleSubstitution: 1 issues

### By Issue Type
- cipher_type_detection: 20 occurrences
