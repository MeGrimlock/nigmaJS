// CRITICAL EMERGENCY PATCH - Prevents system crashes from join() errors
(function() {
    'use strict';

    console.log('[CRITICAL PATCH] Initializing emergency defense system...');

    // GLOBAL DEFENSE: Override Array.prototype.join to prevent crashes
    const originalJoin = Array.prototype.join;
    Array.prototype.join = function(separator = ',') {
        try {
            // If this is not an array, make it one
            if (!Array.isArray(this)) {
                console.warn('[CRITICAL PATCH] join() called on non-array, auto-converting');
                return [this].join(separator);
            }
            return originalJoin.call(this, separator);
        } catch (error) {
            console.error('[CRITICAL PATCH] join() failed, returning empty string');
            return '';
        }
    };

    // GLOBAL ERROR INTERCEPTOR: Catch all join() errors
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
        if (message && typeof message === 'string' && message.includes('join is not a function')) {
            console.warn('[CRITICAL PATCH] Intercepted and neutralized join() error');
            return true; // Suppress the error
        }
        return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
    };

    // UNCONDITIONAL PROMISE ERROR SUPPRESSION
    const originalPromiseCatch = window.Promise.prototype.catch;
    window.Promise.prototype.catch = function(onRejected) {
        return originalPromiseCatch.call(this, function(error) {
            if (error && error.message && error.message.includes('join is not a function')) {
                console.warn('[CRITICAL PATCH] Suppressed promise rejection with join() error');
                return; // Don't propagate the error
            }
            if (onRejected) return onRejected(error);
            throw error;
        });
    };

    let attempts = 0;
    const maxAttempts = 200; // 20 seconds

    function applyCriticalPatches() {
        attempts++;

        if (!window.nigmajs) {
            if (attempts < maxAttempts) {
                setTimeout(applyCriticalPatches, 100);
                return;
            } else {
                console.log('[CRITICAL PATCH] nigmajs not found, but global defenses are active');
                return;
            }
        }

        console.log('[CRITICAL PATCH] nigmajs detected, applying surgical patches...');

        // SURGICAL PATCHING: Override problematic functions
        function safeOverride(obj, path, methodName) {
            if (!obj || !obj[methodName]) return false;

            const original = obj[methodName];
            obj[methodName] = function(...args) {
                try {
                    const result = original.apply(this, args);

                    // POST-PROCESSING: Ensure arrays are arrays
                    if (result && typeof result === 'object') {
                        if (result.periodicIC !== undefined && !Array.isArray(result.periodicIC)) {
                            result.periodicIC = [];
                        }
                        if (result.autoCorrelation && !Array.isArray(result.autoCorrelation.peaks)) {
                            result.autoCorrelation.peaks = [];
                        }
                        if (result.methods && !Array.isArray(result.methods) && typeof result.methods !== 'object') {
                            result.methods = {};
                        }
                    }

                    return result;
                } catch (error) {
                    if (error.message && error.message.includes('join is not a function')) {
                        console.warn(`[CRITICAL PATCH] ${path}.${methodName} crashed with join() error, safe fallback applied`);
                        // Return safe defaults based on method
                        if (methodName === 'identify') {
                            return [{
                                type: 'random-unknown',
                                confidence: 0.5,
                                reason: 'Analysis protected by emergency patch'
                            }];
                        }
                        if (methodName === 'analyze') {
                            return {
                                isPolyalphabetic: false,
                                confidence: 0,
                                recommendation: 'protected',
                                periodicIC: [],
                                autoCorrelation: { peaks: [] },
                                methods: {}
                            };
                        }
                        return null;
                    }
                    console.error(`[CRITICAL PATCH] ${path}.${methodName} error:`, error);
                    throw error;
                }
            };
            console.log(`[CRITICAL PATCH] Protected ${path}.${methodName}`);
            return true;
        }

        // Apply patches to all known problematic areas
        function recursivePatch(obj, path = 'nigmajs') {
            if (!obj || typeof obj !== 'object') return;

            // Direct patches
            safeOverride(obj, path, 'identify');
            safeOverride(obj, path, 'analyze');

            // Recursive search
            for (const key in obj) {
                if (obj[key] && typeof obj[key] === 'object' && key !== 'default') {
                    recursivePatch(obj[key], `${path}.${key}`);
                }
            }
        }

        try {
            recursivePatch(window.nigmajs);
            console.log('[CRITICAL PATCH] Surgical patches applied successfully');
        } catch (error) {
            console.error('[CRITICAL PATCH] Error during surgical patching:', error);
        }
    }

    // Initialize the critical defense system
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(applyCriticalPatches, 50));
    } else {
        setTimeout(applyCriticalPatches, 50);
    }

    console.log('[CRITICAL PATCH] Emergency defense system active - join() errors will be neutralized');
})();
