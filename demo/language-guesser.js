/**
 * Chart Factory for NigmaJS Frequency Analysis
 * Encapsulates logic for creating and updating frequency comparison charts.
 */

class FrequencyChart {
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
        switch(lang) {
            case 'spanish': return { bg: 'rgba(245, 158, 11, 0.3)', border: 'rgba(245, 158, 11, 1)' }; // Orange
            case 'english': return { bg: 'rgba(59, 130, 246, 0.3)', border: 'rgba(59, 130, 246, 1)' }; // Blue
            case 'italian': return { bg: 'rgba(16, 185, 129, 0.3)', border: 'rgba(16, 185, 129, 1)' }; // Green
            case 'french': return { bg: 'rgba(139, 92, 246, 0.3)', border: 'rgba(139, 92, 246, 1)' }; // Purple
            case 'german': return { bg: 'rgba(239, 68, 68, 0.3)', border: 'rgba(239, 68, 68, 1)' }; // Red
            case 'portuguese': return { bg: 'rgba(20, 184, 166, 0.3)', border: 'rgba(20, 184, 166, 1)' }; // Teal
            case 'russian': return { bg: 'rgba(236, 72, 153, 0.3)', border: 'rgba(236, 72, 153, 1)' }; // Pink
            case 'chinese': return { bg: 'rgba(249, 115, 22, 0.3)', border: 'rgba(249, 115, 22, 1)' }; // Orange-Red
            default: return { bg: 'rgba(148, 163, 184, 0.3)', border: 'rgba(148, 163, 184, 1)' }; // Grey
        }
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const cipherInput = document.getElementById('cipherInput');
    const chartsContainer = document.getElementById('chartsContainer');
    const recommendationCard = document.getElementById('recommendationCard');
    const detectedLangEl = document.getElementById('detectedLang');
    const confidenceScoreEl = document.getElementById('confidenceScore');
    
    // Wait for NigmaJS to load
    const checkInterval = setInterval(() => {
        if (window.nigmajs && window.nigmajs.LanguageAnalysis) {
            clearInterval(checkInterval);
            initializeApp();
        }
    }, 100);

    let charts = [];

    function initializeApp() {
        const { LanguageAnalysis } = window.nigmajs;
        const languages = Object.keys(LanguageAnalysis.languages); // ['spanish', 'english']
        const types = ['monograms', 'bigrams', 'trigrams', 'quadgrams'];

        // Generate DOM and Charts
        types.forEach(type => {
            // Create Row
            const rowDiv = document.createElement('div');
            rowDiv.className = 'chart-row';
            rowDiv.innerHTML = `
                <div class="row-title">${capitalize(type)} Comparison</div>
                <div class="charts-flex" id="row-${type}"></div>
            `;
            chartsContainer.appendChild(rowDiv);

            const flexContainer = rowDiv.querySelector('.charts-flex');

            // Create Column for each Language
            languages.forEach(lang => {
                const wrapper = document.createElement('div');
                wrapper.className = 'chart-wrapper';
                
                // Canvas
                const canvas = document.createElement('canvas');
                wrapper.appendChild(canvas);

                // Score Badge
                const badge = document.createElement('div');
                badge.className = 'score-badge score-bad';
                badge.innerText = 'Chi²: N/A';
                badge.id = `score-${lang}-${type}`;
                wrapper.appendChild(badge);

                flexContainer.appendChild(wrapper);

                // Initialize Chart Instance
                const standardData = getStandardData(lang, type, LanguageAnalysis);
                const chartInstance = new FrequencyChart(canvas.getContext('2d'), lang, type, standardData);
                
                charts.push({
                    instance: chartInstance,
                    lang: lang,
                    type: type,
                    badgeId: `score-${lang}-${type}`
                });
            });
        });

        // Add Event Listener
        cipherInput.addEventListener('input', (e) => {
            updateAllCharts(e.target.value);
        });
    }

    function updateAllCharts(text) {
        if (!text) return;
        const { LanguageAnalysis } = window.nigmajs;

        charts.forEach(item => {
            const score = item.instance.update(text, LanguageAnalysis);
            updateBadge(item.badgeId, score);
        });

        // Update Recommendation
        const candidates = LanguageAnalysis.detectLanguage(text);
        if (candidates.length > 0) {
            const winner = candidates[0];
            const runnerUp = candidates[1];
            
            recommendationCard.style.display = 'block';
            let resultText = capitalize(winner.language) + ' ' + getFlag(winner.language);
            
            // If the difference between 1st and 2nd is small, show ambiguity
            if (runnerUp && (runnerUp.score - winner.score < 5)) {
                resultText += ` (or possibly ${capitalize(runnerUp.language)} ${getFlag(runnerUp.language)})`;
            }

            detectedLangEl.textContent = resultText;
            confidenceScoreEl.textContent = winner.score.toFixed(2);
            
            // Set color based on confidence
            if (winner.score < 50) confidenceScoreEl.style.color = '#10b981';
            else if (winner.score < 150) confidenceScoreEl.style.color = '#f59e0b';
            else confidenceScoreEl.style.color = '#ef4444';
        } else {
            recommendationCard.style.display = 'none';
        }
    }

    function getFlag(lang) {
        const flags = {
            spanish: '🇪🇸', english: '🇬🇧', italian: '🇮🇹', french: '🇫🇷',
            german: '🇩🇪', portuguese: '🇵🇹', russian: '🇷🇺', chinese: '🇨🇳'
        };
        return flags[lang] || '🏳️';
    }

    function updateBadge(elementId, score) {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerText = `Chi²: ${score.toFixed(2)}`;
            el.className = 'score-badge ' + getScoreClass(score);
        }
    }

    function getScoreClass(score) {
        if (score < 50) return 'score-good';
        if (score < 150) return 'score-med';
        return 'score-bad';
    }

    function getStandardData(lang, type, Analysis) {
        const langData = Analysis.languages[lang];
        switch(type) {
            case 'monograms': return langData.monograms;
            case 'bigrams': return langData.bigrams;
            case 'trigrams': return langData.trigrams;
            case 'quadgrams': return langData.quadgrams;
            default: return {};
        }
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});
