# Test Optimization Analysis

## Patrones Comunes Identificados

### 1. **Flujo de Test Común**

Ambos tipos de tests siguen el mismo patrón básico:

```
1. Setup (cargar diccionarios, preparar textos)
2. Crear cipher con plaintext
3. Codificar → ciphertext
4. Crear Orchestrator
5. Detectar tipo de cipher (opcional)
6. Descifrar con orchestrator.autoDecrypt()
7. Verificar resultados
8. Logging/Reporting
```

### 2. **Componentes Compartidos**

- **Orchestrator**: Ambos usan `new Orchestrator(language)` y `orchestrator.autoDecrypt()`
- **Test Texts**: Ambos usan textos short/medium/long
- **Dictionary Loading**: Ambos necesitan cargar diccionarios
- **Result Verification**: Ambos verifican plaintext, method, confidence, etc.
- **Error Handling**: Ambos usan try-catch

### 3. **Diferencias Clave**

| Aspecto | Phase 2 Tests | Orchestrator Tests |
|---------|---------------|-------------------|
| **Propósito** | Validar detección + análisis + descifrado | Validar funcionalidad del orchestrator |
| **Validación** | IC, tipo de cipher, lenguaje, éxito de descifrado | Resultado básico, método, confianza |
| **Análisis** | Análisis profundo con `analyzeResults()` | Verificación simple con `verifyOrchestratorResult()` |
| **Roadmap** | Genera roadmap de fallos | No genera roadmap |
| **Cobertura** | Matriz cipher × language × textLength | Tests específicos por cipher/language |

## Oportunidades de Optimización

### 1. **Función Común: Encrypt-Decrypt-Verify**

Crear una función que encapsule el flujo común:

```javascript
async function runCipherTest({
    plaintext,
    language,
    encryptFn,
    orchestratorOptions,
    verificationOptions
}) {
    // 1. Encrypt
    const ciphertext = encryptFn(plaintext, language);
    
    // 2. Create orchestrator
    const orchestrator = new Orchestrator(language);
    
    // 3. Decrypt
    const result = await orchestrator.autoDecrypt(ciphertext, orchestratorOptions);
    
    // 4. Verify
    verifyOrchestratorResult(result, verificationOptions);
    
    return { orchestrator, result, ciphertext };
}
```

### 2. **Unificar Carga de Diccionarios**

Ambos cargan diccionarios de forma similar. Podemos crear un helper común:

```javascript
// En un archivo común (test-common.js)
export async function setupTestDictionaries(languages = ['english']) {
    return await loadDictionariesForTests();
}
```

### 3. **Compartir Test Texts**

Los test texts son casi idénticos. Podemos:
- Mover `getTestTexts()` a un archivo común
- Permitir extensión por suite específica
- Cachear textos para evitar recrearlos

### 4. **Función Común para Crear Tests de Cipher**

Unificar `createCipherTestSuite` (orchestrator) con el patrón de Phase 2:

```javascript
export function createCipherTestMatrix({
    cipherName,
    encryptFn,
    languages,
    textLengths = ['short', 'medium', 'long'],
    options = {}
}) {
    // Genera matriz: cipher × language × textLength
    // Similar a Phase 2 pero más flexible
}
```

### 5. **Verificación Unificada**

Crear niveles de verificación:

```javascript
export function verifyDecryptionResult(result, level = 'basic') {
    switch(level) {
        case 'basic':
            verifyOrchestratorResult(result);
            break;
        case 'detailed':
            verifyOrchestratorResult(result);
            verifyCipherDetection(result);
            verifyIC(result);
            break;
        case 'full':
            // Phase 2 style: full analysis
            break;
    }
}
```

### 6. **Configuración de Tests Centralizada**

Crear un archivo de configuración común:

```javascript
// test-config.js
export const TEST_CONFIG = {
    timeouts: {
        phase2: 20000,
        orchestrator: 60000,
        e2e: 120000
    },
    orchestratorOptions: {
        phase2: { tryMultiple: true, useDictionary: true, maxTime: 10000 },
        orchestrator: { tryMultiple: true, maxTime: 60000 },
        e2e: { tryMultiple: true, useDictionary: true, maxTime: 60000 }
    }
};
```

## Propuesta de Refactorización

### Estructura Propuesta

```
src/attacks/tests/
├── common/
│   ├── test-common.js          # Funciones comunes (encrypt-decrypt-verify)
│   ├── test-config.js          # Configuración centralizada
│   ├── test-texts.js           # Test texts compartidos
│   └── test-setup.js           # Setup común (diccionarios, etc.)
│
├── phase2/
│   ├── phase2-test-base.js     # Lógica específica Phase 2
│   └── phase2-test-helpers.js  # Helpers específicos Phase 2
│
├── orchestrator/
│   └── orchestrator-test-base.js  # Lógica específica Orchestrator
│
└── [test files...]
```

### Beneficios Esperados

1. **Reducción de Código Duplicado**: ~40-50% menos código repetido
2. **Mantenibilidad**: Cambios en un lugar se propagan a todos
3. **Consistencia**: Mismo comportamiento en todos los tests
4. **Facilidad de Uso**: APIs más simples y claras
5. **Performance**: Setup compartido, cache de textos

## Plan de Implementación

### Fase 1: Extraer Común
1. Crear `test-common.js` con funciones básicas
2. Mover `getTestTexts()` a `test-texts.js`
3. Crear `test-setup.js` para setup común

### Fase 2: Unificar Helpers
1. Crear `test-config.js` para configuración
2. Unificar funciones de verificación
3. Crear función común encrypt-decrypt-verify

### Fase 3: Refactorizar Tests
1. Actualizar Phase 2 tests para usar comunes
2. Actualizar Orchestrator tests para usar comunes
3. Eliminar código duplicado

### Fase 4: Optimizaciones
1. Cache de textos de prueba
2. Setup lazy de diccionarios
3. Parallelización de tests donde sea posible

