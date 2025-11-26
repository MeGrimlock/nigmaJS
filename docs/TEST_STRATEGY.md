# Test Strategy: Understanding Different Test Suites

## Overview

NigmaJS tiene múltiples suites de tests que sirven propósitos complementarios. Este documento explica cuándo usar cada una y qué validan.

---

## 1. Phase 2 Tests (por idioma) - `phase2-*.test.js`

### Propósito
**Tests sistemáticos y exhaustivos** para validar la detección de cifrados y análisis estadístico.

### Características
- ✅ **Cobertura completa**: 6 idiomas × 12 cifrados × 3 longitudes = **216 tests**
- ✅ **Validación estadística**: Verifica IC (Index of Coincidence), detección de tipo de cifrado, detección de idioma
- ✅ **Generación automática de roadmap**: Documenta fallos para priorizar mejoras
- ✅ **Enfoque en métricas**: Analiza si los resultados del orchestrator son correctos

### Cuándo usar
- Para validar que el sistema funciona correctamente en **todos los idiomas**
- Para identificar **patrones de fallos** sistemáticos
- Para medir **precisión estadística** (IC, detección de idioma, etc.)
- Para generar **roadmap de mejoras** basado en datos

### Ejemplo
```javascript
// Valida: IC correcto, tipo de cifrado detectado, idioma detectado, descifrado exitoso
test('CaesarShift - medium', async () => {
    // Analiza resultados y genera roadmap si falla
});
```

---

## 2. Orchestrator Comprehensive Tests - `orchestrator-comprehensive.test.js`

### Propósito
**Tests funcionales y de casos especiales** que validan comportamiento completo del sistema.

### Características
- ✅ **Edge cases**: Textos con números, textos muy cortos, mixed case
- ✅ **Performance benchmarks**: Mide tiempo de descifrado (ej: "debe descifrar en < 5 segundos")
- ✅ **Multi-language fallback**: Prueba usar orchestrator de un idioma en otro
- ✅ **Cifrados avanzados**: Beaufort, Porta, Gronsfeld, Quagmire (variantes específicas)
- ✅ **Variaciones de longitud**: Valida que funciona con diferentes tamaños de texto
- ✅ **Substitution avanzada**: Frequency-based substitution, random substitution

### Cuándo usar
- Para validar **casos límite** y comportamiento en situaciones especiales
- Para medir **performance** y asegurar que el sistema es rápido
- Para probar **compatibilidad** entre idiomas (fallback)
- Para validar **cifrados complejos** con configuraciones específicas

### Ejemplo
```javascript
// Edge case: texto con números
it('should handle text with numbers', async () => {
    const plaintext = 'THE YEAR 2024 IS A LEAP YEAR WITH 366 DAYS';
    // ...
});

// Performance benchmark
it('should decrypt Caesar in under 5 seconds', async () => {
    const startTime = Date.now();
    // ...
    expect(elapsed).toBeLessThan(5000);
});
```

---

## 3. Orchestrator Comprehensive E2E Tests - `orchestrator-comprehensive-e2e.test.js`

### Propósito
**Tests end-to-end detallados** que validan el flujo completo de detección + descifrado.

### Características
- ✅ **Validación completa del flujo**: Idioma → Tipo de cifrado → Descifrado
- ✅ **Thresholds específicos**: Confidence > 0.7, text matching con tolerancia
- ✅ **Cifrados específicos**: ROT47, Vigenère, Porta, Quagmire, Atbash, Autokey, Baconian, Polybius
- ✅ **Validación detallada**: Verifica cada paso del proceso con logs informativos
- ✅ **Text matching inteligente**: Compara textos con tolerancia (95%, 85%, 80%, 70%)

### Cuándo usar
- Para validar que el **flujo completo** funciona correctamente
- Para asegurar que los **thresholds de confianza** son apropiados
- Para probar **cifrados específicos** con validaciones detalladas
- Para debugging cuando necesitas ver **cada paso del proceso**

### Ejemplo
```javascript
test('should decrypt ROT47 in Spanish', async () => {
    // 1. Verifica detección de idioma
    expect(orchestrator.language).toBe('spanish');
    
    // 2. Verifica detección de tipo de cifrado
    expect(detectedType).toMatch(/caesar-shift/);
    
    // 3. Verifica descifrado con confidence threshold
    expect(result.confidence).toBeGreaterThan(0.7);
    
    // 4. Verifica que el texto coincide
    expect(textsMatch(result.plaintext, plaintext)).toBe(true);
});
```

---

## Comparación: ¿Cuándo usar cada uno?

| Aspecto | Phase 2 Tests | Comprehensive Tests | E2E Tests |
|---------|---------------|-------------------|-----------|
| **Cobertura** | Exhaustiva (216 tests) | Casos especiales | Cifrados específicos |
| **Enfoque** | Métricas y estadísticas | Funcionalidad y performance | Flujo completo |
| **Validación** | IC, detección, roadmap | Edge cases, benchmarks | Thresholds, matching |
| **Idiomas** | Todos (6) | Principalmente English/Spanish | English/Spanish |
| **Cifrados** | 12 tipos básicos | Varios + avanzados | Específicos (8 tipos) |
| **Output** | Roadmap de mejoras | Logs de performance | Logs detallados paso a paso |

---

## Recomendación de Uso

### Para desarrollo diario
1. **Phase 2 tests**: Ejecutar cuando cambias lógica de detección o análisis
2. **Comprehensive tests**: Ejecutar cuando cambias comportamiento funcional o performance
3. **E2E tests**: Ejecutar cuando cambias el flujo del orchestrator o thresholds

### Para CI/CD
- **Phase 2 tests**: Ejecutar en PRs que afectan detección/análisis
- **Comprehensive tests**: Ejecutar en PRs que afectan funcionalidad
- **E2E tests**: Ejecutar en PRs que afectan el orchestrator

### Para debugging
- **Phase 2 tests**: Si el problema es con métricas o detección
- **Comprehensive tests**: Si el problema es con edge cases o performance
- **E2E tests**: Si el problema es con el flujo completo o thresholds

---

## ¿Son redundantes?

**NO**. Cada suite tiene un propósito único:

1. **Phase 2 tests** = "¿Funciona correctamente en todos los idiomas y cifrados?"
2. **Comprehensive tests** = "¿Funciona en casos especiales y es suficientemente rápido?"
3. **E2E tests** = "¿El flujo completo produce resultados con suficiente confianza?"

### Ejemplo de complementariedad

**Scenario**: Un cifrado funciona en Phase 2 pero falla en E2E

- **Phase 2 test**: ✅ Detecta el tipo correcto, IC correcto
- **E2E test**: ❌ Confidence < 0.7, text matching < 95%

**Conclusión**: El sistema detecta correctamente, pero necesita mejorar la confianza o el matching. Sin E2E tests, no sabríamos esto.

---

## Mantenimiento

### ¿Cuándo actualizar cada suite?

- **Phase 2 tests**: Cuando agregas nuevos idiomas o cifrados
- **Comprehensive tests**: Cuando agregas nuevos edge cases o cambias performance
- **E2E tests**: Cuando cambias thresholds o el flujo del orchestrator

### ¿Cuándo eliminar tests?

- **Nunca elimines** tests que aún validan comportamiento importante
- **Consolida** tests si hay duplicación real (mismo test, mismo propósito)
- **Mantén** tests que validan aspectos diferentes aunque parezcan similares

---

## Conclusión

Los tres tipos de tests son **complementarios**, no redundantes:

- **Phase 2**: Validación sistemática y métricas
- **Comprehensive**: Casos especiales y performance  
- **E2E**: Flujo completo y thresholds

Mantener los tres asegura que el sistema funciona correctamente en todos los aspectos.

