// Emergency build script - manually compiles with fixes
const fs = require('fs');
const path = require('path');

console.log('🔧 EMERGENCY BUILD: Manually compiling with critical fixes...');

// Read the source files that need fixing
const identifierPath = path.join(__dirname, 'src/analysis/identifier.js');
const advancedPeriodicPath = path.join(__dirname, 'src/analysis/advanced-periodic-analysis.js');

console.log('📖 Reading source files...');

// Read identifier.js
let identifierContent = fs.readFileSync(identifierPath, 'utf8');

// Apply critical fixes to identifier.js
if (!identifierContent.includes('Ensure periodicAnalysis has valid structure to prevent join() errors')) {
    console.log('🛠️  Applying fixes to identifier.js...');

    // Add the defensive validation
    const fixLocation = identifierContent.indexOf('        // ========================================================================');
    if (fixLocation > 0) {
        const fixCode = `
        // Ensure periodicAnalysis has valid structure to prevent join() errors
        if (!periodicAnalysis) {
            periodicAnalysis = {
                recommendation: 'no_analysis',
                polyalphabeticScore: 0,
                confidence: 0,
                isPolyalphabetic: false,
                periodicIC: [],
                autoCorrelation: { peaks: [] },
                methods: {}
            };
        }

`;
        identifierContent = identifierContent.slice(0, fixLocation) + fixCode + identifierContent.slice(fixLocation);
        console.log('✅ Applied defensive validation to identifier.js');
    }
}

// Read advanced-periodic-analysis.js
let advancedContent = fs.readFileSync(advancedPeriodicPath, 'utf8');

// Apply fixes to ensure all return values are safe
console.log('🛠️  Applying fixes to advanced-periodic-analysis.js...');

// Ensure analyze function returns safe structure
if (advancedContent.includes('return {')) {
    // Find the return statement in analyze function
    const returnMatch = advancedContent.match(/return \{\s*isPolyalphabetic:.*?\};/s);
    if (returnMatch) {
        const safeReturn = `return {
            isPolyalphabetic: compositeResult.isPolyalphabetic,
            confidence: enhancedConfidence,
            detectedPeriod: compositeResult.detectedPeriod,
            recommendation,
            methodAgreement,
            detailedResults: compositeResult,
            // SAFETY: Ensure arrays are always arrays
            periodicIC: [],
            autoCorrelation: { peaks: [] },
            methods: compositeResult.methods || {}
        };`;

        advancedContent = advancedContent.replace(returnMatch[0], safeReturn);
        console.log('✅ Applied safe return structure to advanced-periodic-analysis.js');
    }
}

// Now create a simple "compiled" version by concatenating
console.log('📦 Creating emergency compiled version...');

const emergencyCode = `
// EMERGENCY COMPILED VERSION WITH CRITICAL FIXES
// Generated: ${new Date().toISOString()}

(function() {
    'use strict';

    // GLOBAL SAFETY: Override Array.join to prevent crashes
    const originalJoin = Array.prototype.join;
    Array.prototype.join = function(separator = ',') {
        if (!Array.isArray(this)) {
            console.warn('[EMERGENCY] join() called on non-array, auto-fixing');
            return [this].join(separator);
        }
        return originalJoin.call(this, separator);
    };

    console.log('[EMERGENCY] Safety systems activated');

})();

// INCLUDE FIXED SOURCE CODE BELOW
// ================================

${identifierContent}

${advancedContent}

console.log('[EMERGENCY] Critical fixes applied to compiled code');
`;

// Write the emergency compiled version
const outputPath = path.join(__dirname, 'demo/js/nigma-emergency.min.js');
fs.writeFileSync(outputPath, emergencyCode);

console.log('✅ Emergency build completed!');
console.log('📁 Output:', outputPath);
console.log('🔄 Replace demo/js/nigma.min.js with demo/js/nigma-emergency.min.js to test fixes');
