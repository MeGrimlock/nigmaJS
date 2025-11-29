# Plan de Mejora: ResultAggregator y Detección de Tipos de Cifrado

## Problemas Identificados

### 1. Polialfabéticos (Gronsfeld, Autokey, Porta) → `monoalphabetic-substitution`

**Síntomas:**
- Gronsfeld (short/medium/long): Espera `vigenere-like`, obtiene `monoalphabetic-substitution`
- Autokey (short/medium/long): Espera `vigenere-like`, obtiene `monoalphabetic-substitution` o `random-unknown`
- Porta: Similar comportamiento

**Causas Raíz:**
1. **Umbrales demasiado estrictos**: `_isStrongPolyalphabeticEvidence` requiere:
   - Long texts: `confidence >= 0.55`, `ngramScore >= 0.60`, `dictCoverage >= 0.15`
   - Short texts: `confidence >= 0.50`, `ngramScore >= 0.55`, `dictCoverage >= 0.10`
   
   Pero los logs muestran:
   - Porta: `score=0.52, confidence=0.58` → No cumple `ngramScore >= 0.60` (asumiendo que `score` es `ngramScore`)
   - Gronsfeld: `confidence=0.71` pero probablemente `ngramScore` o `dictCoverage` bajo

2. **Confusión entre `score` y `ngramScore`**: 
   - `PolyalphabeticSolver` retorna `score` (combinado), no `ngramScore` separado
   - `ResultAggregator` busca `ngramScore` pero puede no estar presente

3. **`isPolyalphabeticCandidate` no se está propagando correctamente**:
   - Los resultados de `PolyalphabeticSolver` pueden no tener esta propiedad

4. **Búsqueda de métodos por nombre es frágil**:
   - Busca `method.includes('gronsfeld')` pero el método puede llamarse diferente

### 2. Transposición (RailFence, Amsco) → `monoalphabetic-substitution`

**Síntomas:**
- RailFence (short/medium/long): Espera `transposition`, obtiene `monoalphabetic-substitution`
- Amsco (short/medium/long): Espera `transposition`, obtiene `monoalphabetic-substitution`

**Causas Raíz:**
1. **No hay solvers de transposición ejecutándose**:
   - `StrategySelector` solo tiene un fallback que usa Hill Climbing para transposition
   - No hay `RailFenceSolver` o `AmscoSolver` siendo ejecutados

2. **El `ResultAggregator` busca métodos que no existen**:
   - Busca `method.includes('railfence')` pero nunca se ejecuta un solver de railfence

3. **El fallback a `methodToCipherType` requiere `ngramScore >= 0.6`**:
   - Si el mejor resultado es monoalfabético con `ngramScore < 0.6`, nunca llega al fallback

## Plan de Mejora

### Fase 1: Corregir ResultAggregator para Polialfabéticos (Prioridad ALTA)

#### 1.1. Ajustar umbrales más permisivos
- **Problema**: Los umbrales son demasiado estrictos, especialmente `ngramScore >= 0.60` para textos largos
- **Solución**: 
  - Reducir `ngramScore` requirement: `0.60` → `0.50` (long), `0.55` → `0.45` (short)
  - Reducir `confidence` requirement: `0.55` → `0.50` (long), `0.50` → `0.45` (short)
  - Reducir `dictCoverage` requirement: `0.15` → `0.10` (long), `0.10` → `0.05` (short)

#### 1.2. Usar `score` como fallback para `ngramScore`
- **Problema**: `PolyalphabeticSolver` retorna `score` (combinado), no `ngramScore` separado
- **Solución**: Si `ngramScore` no está presente, usar `score` como proxy (con un factor de conversión)

#### 1.3. Mejorar búsqueda de resultados polialfabéticos
- **Problema**: Búsqueda por nombre de método es frágil
- **Solución**: 
  - Usar `isPolyalphabeticCandidate` como indicador principal
  - Si `isPolyalphabeticCandidate === true`, considerar el resultado como polialfabético
  - Solo verificar umbrales si `isPolyalphabeticCandidate` es true

#### 1.4. Agregar logging para debugging
- Log cuando un resultado polialfabético es rechazado y por qué
- Log los valores de `confidence`, `ngramScore`, `dictCoverage` para cada resultado

### Fase 2: Implementar Solvers de Transposición (Prioridad ALTA)

#### 2.1. Crear/Verificar RailFenceSolver
- **Problema**: No hay solver de RailFence siendo ejecutado
- **Solución**: 
  - Verificar si existe `RailFenceSolver` en `src/attacks/strategies/`
  - Si no existe, crear uno básico que pruebe diferentes números de rails (2-10)
  - Si existe, asegurarse de que se ejecute cuando se detecta `transposition`

#### 2.2. Crear/Verificar AmscoSolver
- **Problema**: No hay solver de Amsco siendo ejecutado
- **Solución**: Similar a RailFenceSolver

#### 2.3. Actualizar StrategySelector
- **Problema**: `StrategySelector` no ejecuta solvers de transposición
- **Solución**: 
  - Agregar casos para `transposition` que ejecuten `RailFenceSolver` y `AmscoSolver`
  - Probar diferentes parámetros (número de rails, claves, etc.)

#### 2.4. Mejorar detección de transposición en ResultAggregator
- **Problema**: Busca métodos que no existen
- **Solución**: 
  - Usar un indicador similar a `isPolyalphabeticCandidate` (`isTranspositionCandidate`)
  - O mejorar la búsqueda por nombre de método para incluir variantes

### Fase 3: Mejorar Lógica de Desempate (Prioridad MEDIA)

#### 3.1. Priorizar método ganador sobre detección inicial
- **Problema**: Si un solver específico (ej: RailFenceSolver) produce el mejor resultado, debería determinar el tipo
- **Solución**: 
  - Si `bestResult.method` indica un tipo específico (ej: 'railfence'), usar ese tipo
  - Solo usar detección inicial si no hay un método ganador claro

#### 3.2. Ajustar umbrales de confianza para transposición
- **Problema**: `hasGoodTrans` requiere `confidence >= 0.55`, pero puede ser demasiado estricto
- **Solución**: Reducir a `0.45` o usar `ngramScore` como indicador alternativo

#### 3.3. Mejorar tie-breaking entre mono y transposición
- **Problema**: La lógica actual favorece monoalfabético en caso de empate
- **Solución**: 
  - Si el método es claramente de transposición (ej: 'railfence'), priorizar transposición
  - Usar `ngramScore` del ciphertext original como indicador (transposición preserva frecuencias)

### Fase 4: Verificación y Testing (Prioridad ALTA)

#### 4.1. Agregar logging detallado
- Log todos los resultados de cada categoría (poly, mono, trans)
- Log los valores de umbrales y si se cumplen
- Log la decisión final y el razonamiento

#### 4.2. Ejecutar tests y verificar mejoras
- Ejecutar `phase2-english.test.js` después de cada fase
- Verificar que los fallos se reduzcan

## Orden de Implementación

1. **Fase 1.1-1.3**: Ajustar umbrales y mejorar búsqueda de polialfabéticos (IMPACTO INMEDIATO)
2. **Fase 2.1-2.3**: Implementar solvers de transposición (IMPACTO INMEDIATO)
3. **Fase 1.4 + 4.1**: Agregar logging para debugging
4. **Fase 3**: Mejorar lógica de desempate
5. **Fase 4.2**: Testing y verificación

## Métricas de Éxito

- **Antes**: 17 tests fallando (Gronsfeld, Autokey, RailFence, Amsco)
- **Objetivo**: < 5 tests fallando
- **Ideal**: 0 tests fallando para estos 4 cifrados

