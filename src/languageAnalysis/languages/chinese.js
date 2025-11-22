// Frequencies for Chinese (Pinyin Transliteration)
export const chineseLetterFrequencies = {
    I: 10.0, A: 9.0, N: 8.5, G: 7.5, E: 7.0, U: 6.5, O: 6.0, H: 5.0, S: 4.5, Z: 4.0, Y: 3.5, J: 3.0, L: 2.5, D: 2.5, T: 2.5, B: 2.0, M: 2.0, C: 1.5, K: 1.5, X: 1.5, W: 1.5, R: 1.5, F: 1.0, P: 1.0, Q: 1.0, V: 0.0
};

export const chineseBigramFrequencies = {
    NG: 5.5, IN: 4.5, AN: 4.0, IA: 3.5, AO: 3.0, OU: 3.0, AI: 3.0, EN: 3.0, ZH: 2.5, SH: 2.5, ON: 2.0, UA: 2.0, CH: 1.5, EI: 1.5, UI: 1.5
};

export const chineseTrigramFrequencies = {
    ING: 2.5, ANG: 2.0, IAN: 1.8, ONG: 1.5, ENG: 1.5, IOU: 1.0, UAN: 1.0, ZHO: 0.8, SHE: 0.8, HEN: 0.8
};

export const chineseQuadgramFrequencies = {
    IONG: 0.5, UANG: 0.5, IANG: 0.5, SHEN: 0.4, CHEN: 0.4, ZHON: 0.4, HENG: 0.4, JING: 0.4, WANG: 0.4, YANG: 0.4
};

export default {
    monograms: chineseLetterFrequencies,
    bigrams: chineseBigramFrequencies,
    trigrams: chineseTrigramFrequencies,
    quadgrams: chineseQuadgramFrequencies
};

