/**
 * Chart Factory for NigmaJS Frequency Analysis
 * Encapsulates logic for creating and updating frequency comparison charts.
 */

export class FrequencyChart {
    /**
     * @param {HTMLCanvasElement} canvasCtx - The canvas 2D context
     * @param {string} language - Language name (e.g., 'spanish', 'english')
     * @param {string} type - Analysis type ('monograms', 'bigrams', 'trigrams', 'quadgrams')
     * @param {Object} standardData - The standard frequency data for this language/type
     */
    constructor(canvasCtx, language, type, standardData) {
        this.language = language;
        this.type = type;
        this.standardData = standardData;
        this.chart = this.initChart(canvasCtx);
    }

    initChart(ctx) {
        const langColor = this.getLanguageColor(this.language);
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: `Standard ${this.capitalize(this.language)} (%)`,
                        data: [],
                        backgroundColor: langColor.bg,
                        borderColor: langColor.border,
                        borderWidth: 1,
                        order: 2
                    },
                    {
                        label: 'Input Text (%)',
                        data: [],
                        backgroundColor: 'rgba(16, 185, 129, 0.6)', // --success
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Performance optimization for many charts
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                },
                plugins: {
                    legend: { 
                        labels: { color: '#e2e8f0', boxWidth: 10, font: { size: 11 } } 
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    title: {
                        display: true,
                        text: `${this.capitalize(this.language)} - ${this.capitalize(this.type)}`,
                        color: '#e2e8f0',
                        font: { size: 14, weight: 'bold' }
                    }
                }
            }
        });
    }

    update(inputText, LanguageAnalysis) {
        // Determine N for N-gram
        const n = this.getNValue();
        
        // Calculate frequencies
        let inputFreqs;
        if (n === 1) {
            inputFreqs = LanguageAnalysis.getLetterFrequencies(inputText);
        } else {
            inputFreqs = LanguageAnalysis.getNgramFrequencies(inputText, n);
        }

        // Generate Labels
        const labels = this.generateLabels(inputFreqs);

        // Map Data
        const standardData = labels.map(l => this.standardData[l] || 0);
        const inputData = labels.map(l => inputFreqs[l] || 0);

        // Update Chart
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = standardData;
        this.chart.data.datasets[1].data = inputData;
        this.chart.update();

        return this.calculateScore(inputFreqs, LanguageAnalysis);
    }

    generateLabels(inputFreqs) {
        if (this.type === 'monograms') {
            return Object.keys(this.standardData).sort();
        }

        const standardKeys = this.getTopKeys(this.standardData, 10);
        const inputKeys = this.getTopKeys(inputFreqs, 5);
        const allKeys = new Set([...standardKeys, ...inputKeys]);
        
        return Array.from(allKeys).sort((a, b) => {
            const stdA = this.standardData[a] || 0;
            const stdB = this.standardData[b] || 0;
            return stdB - stdA;
        });
    }

    calculateScore(inputFreqs, LanguageAnalysis) {
        return LanguageAnalysis.calculateChiSquared(inputFreqs, this.standardData);
    }

    getNValue() {
        switch(this.type) {
            case 'monograms': return 1;
            case 'bigrams': return 2;
            case 'trigrams': return 3;
            case 'quadgrams': return 4;
            default: return 1;
        }
    }

    getTopKeys(freqObj, n) {
        return Object.entries(freqObj)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([key]) => key);
    }

    getLanguageColor(lang) {
        if (lang === 'spanish') {
            return { bg: 'rgba(245, 158, 11, 0.3)', border: 'rgba(245, 158, 11, 1)' }; // Orange
        } else if (lang === 'english') {
            return { bg: 'rgba(59, 130, 246, 0.3)', border: 'rgba(59, 130, 246, 1)' }; // Blue
        }
        return { bg: 'rgba(148, 163, 184, 0.3)', border: 'rgba(148, 163, 184, 1)' }; // Grey
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

