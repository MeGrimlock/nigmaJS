# Fase 1: Mejoras Aplicadas a ResultAggregator

## Cambios Implementados

### 1. Uso de `score` como fallback de `ngramScore`

**Problema**: `PolyalphabeticSolver` retorna `score` (combinado), no `ngramScore` separado. `ResultAggregator._isStrongPolyalphabeticEvidence()` buscaba `ngramScore` que no existía.

**Solución**: 
- Si `ngramScore` no está disponible, usar `score` como proxy
- Si `score` está normalizado [0,1], usarlo directamente
- Si `score` es raw, usar estimación conservadora (0.4)

**Código**:
```javascript
let ngramScore = result.ngramScore;
if (ngramScore === undefined || ngramScore === null) {
    if (result.score !== undefined && result.score !== null && result.score > -Infinity) {
        if (result.score >= 0 && result.score <= 1) {
            ngramScore = result.score; // Assume normalized
        } else {
            ngramScore = 0.4; // Conservative estimate
        }
    } else {
        ngramScore = 0;
    }
}
```

### 2. Umbrales Relajados para Polialfabéticos

**Antes**:
- Long texts (>=100): confidence >= 0.55, ngramScore >= 0.60, dictCoverage >= 0.15
- Short texts (<100): confidence >= 0.50, ngramScore >= 0.55, dictCoverage >= 0.10

**Ahora**:
- Long texts (>=100): confidence >= 0.50, ngramScore >= 0.50, dictCoverage >= 0.10
- Short texts (<100): confidence >= 0.45, ngramScore >= 0.45, dictCoverage >= 0.05

### 3. Umbrales Relajados para Mono/Transposición

**Antes**: `confidence >= 0.55`

**Ahora**: `confidence >= 0.45`

### 4. Asegurar que `ngramScore` y `dictScore` estén siempre presentes

**Cambio**: En `aggregate()`, siempre calcular y establecer `ngramScore` y `dictScore`, incluso si el resultado ya los tiene (para asegurar consistencia).

### 5. Logging de Debug

**Agregado**: Logging condicional (cuando `NIGMAJS_DEBUG=true`) para ver por qué se acepta o rechaza evidencia polialfabética.

## Verificación de Tests

**Confirmado**: Los tests están usando `result.cipherType` (correcto), que es el tipo final determinado por `ResultAggregator`, no la detección inicial.

**Código verificado**:
```javascript
// src/attacks/tests/phase2/phase2-test-helpers.js
const finalCipherType = result.cipherType || detection?.families[0]?.type || 'unknown';
```

## Resultados Esperados

Estos cambios deberían mejorar la detección de:
- **Gronsfeld** (short/medium/long): Ahora debería detectarse como `vigenere-like` si cumple umbrales relajados
- **Autokey** (short/medium/long): Similar a Gronsfeld
- **Porta** (short/medium/long): Similar a Gronsfeld

## Próximos Pasos

1. Ejecutar tests y comparar resultados
2. Si mejoramos, proceder con Fase 2 (crear solvers de transposición)
3. Si empeoramos, ajustar umbrales más finamente

