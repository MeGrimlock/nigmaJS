export const portugueseLetterFrequencies = {
    A: 14.63, E: 12.57, O: 10.73, S: 7.81, R: 6.53, I: 6.18, N: 5.05, D: 4.99, M: 4.74, U: 4.63, T: 4.34, C: 3.88, L: 2.78, P: 2.52, V: 1.67, G: 1.30, H: 1.28, Q: 1.20, B: 1.04, F: 1.02, Z: 0.47, J: 0.40, X: 0.21, K: 0.02, Y: 0.01, W: 0.01
};

export const portugueseBigramFrequencies = {
    DE: 3.15, ES: 2.65, OS: 2.45, AS: 2.42, EN: 2.25, AD: 2.15, ON: 1.95, RA: 1.85, TE: 1.75, OM: 1.65, CO: 1.55, ER: 1.45, OR: 1.35, QUE: 1.25, SE: 1.15
};

export const portugueseTrigramFrequencies = {
    QUE: 1.25, ENT: 0.95, NDE: 0.85, EST: 0.82, COM: 0.75, PAR: 0.72, MEN: 0.71, UMA: 0.65, ADO: 0.62, POR: 0.61
};

export const portugueseQuadgramFrequencies = {
    PARA: 0.55, QUE: 0.45, ESTA: 0.42, COMO: 0.41, MENT: 0.35, ENTE: 0.33, ACAO: 0.31, PELA: 0.29, ONDE: 0.28, MAIS: 0.25
};

export default {
    monograms: portugueseLetterFrequencies,
    bigrams: portugueseBigramFrequencies,
    trigrams: portugueseTrigramFrequencies,
    quadgrams: portugueseQuadgramFrequencies
};
