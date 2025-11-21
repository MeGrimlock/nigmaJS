export const frenchLetterFrequencies = {
    E: 14.71, A: 7.63, I: 7.52, S: 7.94, N: 7.09, R: 6.69, T: 7.24, O: 5.79, L: 5.86, U: 6.31, D: 3.66, C: 3.26, M: 2.96, P: 2.52, V: 1.83, G: 1.04, F: 1.06, B: 0.90, H: 0.73, Q: 1.36, X: 0.38, J: 0.61, Y: 0.12, Z: 0.32, K: 0.11, W: 0.04
};

export const frenchBigramFrequencies = {
    ES: 3.15, DE: 2.65, LE: 2.45, EN: 2.42, RE: 2.25, NT: 2.15, ON: 1.95, ER: 1.85, TE: 1.75, EL: 1.65, AN: 1.55, SE: 1.45, LA: 1.35, AI: 1.25, IT: 1.15
};

export const frenchTrigramFrequencies = {
    ENT: 1.25, LES: 0.95, ION: 0.85, DEL: 0.82, QUE: 0.75, EST: 0.72, LLE: 0.71, DES: 0.65, AIT: 0.62, QUI: 0.61
};

export const frenchQuadgramFrequencies = {
    TION: 0.55, MENT: 0.45, QUEL: 0.42, DANS: 0.41, POUR: 0.35, ELLE: 0.33, ESTA: 0.31, PALA: 0.29, ETTE: 0.28, OUS: 0.25
};

export default {
    monograms: frenchLetterFrequencies,
    bigrams: frenchBigramFrequencies,
    trigrams: frenchTrigramFrequencies,
    quadgrams: frenchQuadgramFrequencies
};
