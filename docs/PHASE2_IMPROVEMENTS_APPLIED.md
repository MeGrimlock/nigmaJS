# Fase 2: Solvers de Transposición Implementados

## Cambios Implementados

### 1. RailFenceSolver (`src/attacks/strategies/railfence-solver.js`)

**Nuevo solver** que:
- Prueba diferentes números de rails (2-10)
- Usa `Scorers.scoreTextNormalized` para scoring (consistente con código moderno)
- Valida con diccionario + n-gramas
- Score combinado: 70% n-gram + 30% diccionario
- Marca resultados con `isTranspositionCandidate: true`
- Early termination si encuentra match muy bueno

**Estructura**:
```javascript
- Prueba rails: [2, 3, 4, 5, 6, 7, 8, 9, 10]
- Para cada rail: decodifica y evalúa
- Retorna mejor resultado con: plaintext, method='railfence', confidence, score, ngramScore, rails, wordCoverage, isTranspositionCandidate
```

### 2. AmscoSolver (`src/attacks/strategies/amsco-solver.js`)

**Nuevo solver** que:
- Genera claves válidas de Amsco (permutaciones de números secuenciales 1-n)
- Prueba claves de longitud 2-5 (más comunes)
- Usa `Scorers.scoreTextNormalized` para scoring
- Valida con diccionario + n-gramas
- Score combinado: 70% n-gram + 30% diccionario
- Marca resultados con `isTranspositionCandidate: true`
- Early termination si encuentra match muy bueno

**Claves generadas**:
- Longitud 2: '12', '21'
- Longitud 3: '123', '132', '213', '231', '312', '321'
- Longitud 4: 24 permutaciones comunes
- Longitud 5: Primeras 20 permutaciones (para evitar demasiadas combinaciones)

### 3. StrategySelector Actualizado

**Cambios**:
- Agregados imports: `RailFenceSolver`, `AmscoSolver`
- Caso `'transposition'` ahora ejecuta:
  1. RailFenceSolver (primero, más común)
  2. AmscoSolver (segundo)
  3. Hill Climbing como fallback (por si acaso es realmente sustitución)

**Antes**:
```javascript
case 'transposition':
    // Solo Hill Climbing como fallback
    strategies.push({ name: 'Hill Climbing (Transposition Fallback)', ... });
```

**Ahora**:
```javascript
case 'transposition':
    strategies.push({ name: 'Rail Fence', execute: async (text) => { ... } });
    strategies.push({ name: 'Amsco', execute: async (text) => { ... } });
    strategies.push({ name: 'Hill Climbing (Transposition Fallback)', ... });
```

### 4. ResultAggregator Mejorado

**Cambios**:
- Búsqueda de resultados de transposición ahora usa `isTranspositionCandidate` flag
- Prioriza `isTranspositionCandidate` sobre búsqueda por nombre de método
- Si `bestResult.isTranspositionCandidate === true`, retorna inmediatamente `'transposition'`

**Código**:
```javascript
// Priorizar transposición si explícitamente marcada
if (bestResult.isTranspositionCandidate) {
    return 'transposition';
}

// Búsqueda mejorada
const transResult = allResults.find(r =>
    r.isTranspositionCandidate || (r.method && (
        r.method.includes('railfence') ||
        r.method.includes('amsco') ||
        r.method.includes('columnar')
    ))
);
```

## Resultados Esperados

Estos cambios deberían mejorar la detección de:
- **RailFence** (short/medium/long): Ahora debería detectarse como `transposition`
- **Amsco** (short/medium/long): Ahora debería detectarse como `transposition`

## Próximos Pasos

1. Ejecutar tests y comparar resultados
2. Si mejoramos, documentar mejoras
3. Si aún hay problemas, ajustar umbrales o lógica de decisión

