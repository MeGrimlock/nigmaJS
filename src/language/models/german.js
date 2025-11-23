export const germanLetterFrequencies = {
    E: 16.93, N: 10.53, I: 6.29, R: 6.89, S: 6.42, A: 5.58, T: 5.79, D: 4.96, H: 3.88, U: 3.83, L: 3.60, C: 3.44, G: 3.02, M: 2.55, O: 2.24, B: 1.96, W: 1.78, F: 1.49, K: 1.32, V: 0.79, P: 0.67, Z: 1.19, J: 0.24, Y: 0.05, X: 0.05, Q: 0.02
};

export const germanBigramFrequencies = {
    EN: 3.88, ER: 3.54, CH: 2.75, TE: 2.28, DE: 2.05, ND: 1.99, EI: 1.86, IE: 1.79, IN: 1.67, ES: 1.58, GE: 1.45, UN: 1.35, NE: 1.25, ST: 1.15, RE: 1.10
};

export const germanTrigramFrequencies = {
    EIN: 1.25, ICH: 1.15, NDE: 0.95, DIE: 0.92, UND: 0.85, DER: 0.82, CHE: 0.75, END: 0.72, GEN: 0.65, SCH: 0.61
};

export const germanQuadgramFrequencies = {
    ISCH: 0.55, EINE: 0.45, LICH: 0.42, SCHE: 0.41, NGEN: 0.35, ENDE: 0.33, ICHE: 0.31, UNGE: 0.29, AUCH: 0.28, SIND: 0.25
};

export default {
    monograms: germanLetterFrequencies,
    bigrams: germanBigramFrequencies,
    trigrams: germanTrigramFrequencies,
    quadgrams: germanQuadgramFrequencies
};
