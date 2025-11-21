// Frequencies for Standard Russian (Cyrillic)
export const russianLetterFrequencies = {
    O: 10.97, E: 8.45, A: 8.01, I: 7.35, N: 6.70, T: 6.26, S: 5.47, R: 4.73, V: 4.54, L: 4.40, K: 3.49, M: 3.21, D: 2.98, P: 2.81, U: 2.62, Y: 1.90, Z: 1.65, G: 1.70, B: 1.59, C: 0.47, H: 0.95, J: 1.21
};

// NOTE: This maps approximate Latin transliterations for the demo's sake if input is transliterated,
// or we assume the input is Cyrillic and we clean it accordingly.
// For NigmaJS which is mostly Latin-cipher based, we'll assume transliterated input or Latin-mapped Cyrillic.
// If strict Cyrillic is needed, we'd need to update the regex in analysis.js to allow Cyrillic.

export const russianBigramFrequencies = {
    ST: 1.5, NO: 1.4, EN: 1.3, OV: 1.2, NA: 1.1, RA: 1.0, KO: 0.9, OS: 0.8, TO: 0.8, RO: 0.8, AL: 0.7, PO: 0.7, NI: 0.7, GO: 0.7, VE: 0.6
};

export const russianTrigramFrequencies = {
    STO: 0.5, OST: 0.4, NOV: 0.4, OVA: 0.4, IYE: 0.3, NIE: 0.3, PRO: 0.3, TEL: 0.3, NNY: 0.3, ENT: 0.3
};

export const russianQuadgramFrequencies = {
    STVO: 0.3, NOST: 0.2, IYEM: 0.2, LENI: 0.2, SKIY: 0.2, OVAL: 0.2, PRED: 0.2, STVA: 0.2, NOGO: 0.2, TORY: 0.2
};

export default {
    monograms: russianLetterFrequencies,
    bigrams: russianBigramFrequencies,
    trigrams: russianTrigramFrequencies,
    quadgrams: russianQuadgramFrequencies
};
