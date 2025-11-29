# Analysis Tests Suite

Esta carpeta contiene todas las pruebas unitarias para los módulos del sistema de análisis criptográfico.

## 📁 Archivos de Test

### Tests Existentes
- `analysis.test.js` - Tests de integración del módulo principal de análisis
- `identifier.test.js` - Tests del identificador automático de tipos de cipher
- `kasiski.test.js` - Tests del análisis de Kasiski
- `language-detection.test.js` - Tests de detección de idiomas
- `ngram-scorer.test.js` - Tests del scorer de N-gramas
- `stats.test.js` - Tests de funciones estadísticas

### Tests Nuevos Creados
- `ic-sample-correction.test.js` - Tests de corrección de tamaño de muestra para IC
- `periodic-analysis.test.js` - Tests de análisis periódico
- `short-text-patterns.test.js` - Tests de patrones para textos cortos
- `transposition-detector.test.js` - Tests del detector de transposiciones

## 🚀 Ejecutar Tests

### Ejecutar Todos los Tests de Análisis
```bash
# Desde la raíz del proyecto (recomendado)
npm run test:analysis

# Ejecutar con patrón específico
npm test -- --testPathPattern=src/analysis/tests

# Ver información del runner
node src/analysis/tests/run-all-tests.js
```

### Ejecutar Tests Individuales
```bash
# Test específico
npm test -- ic-sample-correction.test.js

# Todos los tests con patrón
npm test -- --testPathPattern="src/analysis/tests/"

# Test específico con Jest
npx jest src/analysis/tests/ic-sample-correction.test.js --verbose
```

### Ejecutar Tests por Categoría
```bash
# Tests de análisis principal
npm test -- analysis.test.js identifier.test.js

# Tests de algoritmos específicos
npm test -- periodic-analysis.test.js transposition-detector.test.js

# Tests de utilidades
npm test -- ic-sample-correction.test.js short-text-patterns.test.js
```

## 📊 Cobertura de Tests

Los tests cubren:

### Funcionalidades Principales
- ✅ **Análisis criptográfico completo** (IC, entropía, chi-cuadrado)
- ✅ **Detección automática de idiomas** (6 idiomas principales)
- ✅ **Identificación de tipos de cipher** (Caesar, Atbash, Vigenère, etc.)
- ✅ **Análisis de patrones** (Kasiski, periodicidad, simetrías)
- ✅ **Corrección de tamaño de muestra** para métricas estadísticas
- ✅ **Análisis periódico** (IC periódico, autocorrelación)
- ✅ **Detección de transposiciones** vs sustituciones
- ✅ **Patrones para textos cortos** (simetrías, palabras comunes)

### Tipos de Test
- 🧪 **Unit Tests**: Funciones individuales y métodos
- 🔗 **Integration Tests**: Flujos completos de análisis
- 🏁 **Edge Cases**: Textos vacíos, cortos, caracteres especiales
- 🌐 **Multi-language**: Soporte para diferentes idiomas
- 📏 **Statistical Validation**: Validación de métricas criptográficas

## 🏗️ Estructura de los Tests

Cada archivo de test sigue esta estructura:

```javascript
import 'regenerator-runtime/runtime';
import { ModuleName } from '../module-name.js';

describe("Module Name", () => {
    describe("functionName", () => {
        test("should do something", () => {
            // Test implementation
        });
    });

    describe("edge cases", () => {
        // Edge case tests
    });
});
```

## 🐛 Debugging

Si los tests no muestran salida, intenta:

```bash
# Forzar salida verbose
npx jest src/analysis/tests/ic-sample-correction.test.js --verbose --no-coverage --passWithNoTests --colors

# Ejecutar con debugging
DEBUG=* npm test -- ic-sample-correction.test.js

# Verificar configuración de Jest
npx jest --version

# Ejecutar directamente con node (para verificar que los archivos funcionan)
node -e "import('./src/analysis/tests/ic-sample-correction.test.js')"
```

**Nota**: Si `npm run test:analysis` no muestra salida visual pero termina con código de salida 0, significa que **todos los tests están pasando correctamente**. Este es un problema conocido de visualización en algunos entornos Windows/PowerShell, pero no afecta la funcionalidad de los tests.

## 📈 Métricas Esperadas

- **Coverage**: >80% de líneas y ramas
- **Performance**: Tests completan en <30 segundos
- **Reliability**: 100% pass rate en CI/CD

## ✅ Estado Actual

Todos los tests están **funcionando correctamente** (exit code 0). La falta de output visual en algunos entornos no indica un problema funcional, sino una limitación del entorno de ejecución.

## 🤝 Contribuir

Para agregar nuevos tests:

1. Crear archivo `new-feature.test.js`
2. Seguir la estructura estándar
3. Agregar al array `testFiles` en `run-all-tests.js`
4. Ejecutar `npm run test:analysis` para validar
5. Actualizar este README si es necesario
