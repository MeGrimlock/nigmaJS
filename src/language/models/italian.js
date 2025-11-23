export const italianLetterFrequencies = {
    E: 11.79, A: 11.74, I: 11.28, O: 9.83, N: 6.88, R: 6.37, T: 5.62, L: 6.51, S: 4.98, C: 4.50, D: 3.73, P: 3.05, U: 3.01, M: 2.51, V: 2.10, G: 1.64, H: 1.54, F: 0.95, B: 0.92, Q: 0.51, Z: 0.49, K: 0.00, J: 0.00, X: 0.00, Y: 0.00, W: 0.00
};

export const italianBigramFrequencies = {
    ER: 3.01, ES: 2.85, ON: 2.62, RE: 2.54, EL: 2.45, EN: 2.32, DE: 2.25, DI: 2.15, ST: 2.05, TI: 2.01, AN: 1.95, LA: 1.92, AL: 1.85, NT: 1.81, RA: 1.75
};

export const italianTrigramFrequencies = {
    CHE: 1.25, ERE: 0.95, ZIO: 0.85, DEL: 0.82, ELA: 0.75, ONE: 0.72, EST: 0.71, QUE: 0.65, ALL: 0.62, ENT: 0.61
};

export const italianQuadgramFrequencies = {
    ZIONE: 0.55, MENT: 0.45, ALLA: 0.42, DELL: 0.41, HANN: 0.35, ANNO: 0.33, ESTA: 0.31, OLLA: 0.29, IONE: 0.28, ONTE: 0.25
};

export default {
    monograms: italianLetterFrequencies,
    bigrams: italianBigramFrequencies,
    trigrams: italianTrigramFrequencies,
    quadgrams: italianQuadgramFrequencies
};
