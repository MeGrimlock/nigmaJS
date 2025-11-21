# Cifrados Pendientes de Implementar

## 📋 Resumen de Cifrados Ya Implementados

### ✅ Shift Ciphers
- Caesar Shift
- ROT5, ROT7, ROT13, ROT18, ROT47

### ✅ Polyalphabetic Ciphers
- Vigenère
- Quagmire I, II, III, IV

### ✅ Dictionary Ciphers
- Atbash
- Autokey
- Baconian
- Bazeries
- Morse
- Polybius
- Simple Substitution

### ✅ Columnar Ciphers
- AMSCO

### ✅ Mechanical Ciphers
- Enigma Machine

---

## 🎯 Cifrados Pendientes (de Simple a Complejo)

### 🔵 NIVEL 1: MUY SIMPLES (1-2 horas cada uno) ✅ COMPLETADO

#### 1. **Beaufort Cipher** ✅
- **Tipo**: Polialfabético
- **Complejidad**: ⭐
- **Descripción**: Similar a Vigenère pero con sustracción en lugar de suma
- **Dificultad**: Muy baja - solo cambiar la operación matemática
- **Estado**: ✅ Implementado - Tests: 7/7 pasando

#### 2. **Porta Cipher** ✅
- **Tipo**: Polialfabético
- **Complejidad**: ⭐
- **Descripción**: Usa alfabetos mutuamente reversibles basados en una clave
- **Dificultad**: Muy baja - similar a Vigenère con alfabetos predefinidos
- **Estado**: ✅ Implementado - Tests: 7/7 pasando

#### 3. **Gronsfeld Cipher** ✅
- **Tipo**: Polialfabético
- **Complejidad**: ⭐
- **Descripción**: Variante de Vigenère que usa números en lugar de letras como clave
- **Dificultad**: Muy baja - Vigenère con clave numérica
- **Estado**: ✅ Implementado - Tests: 9/9 pasando

#### 4. **Bifid Cipher** ✅
- **Tipo**: Sustitución + Transposición
- **Complejidad**: ⭐⭐
- **Descripción**: Combina Polybius Square con transposición fraccionada
- **Dificultad**: Baja - ya tienes Polybius, solo agregar transposición
- **Estado**: ✅ Implementado - Tests: 9/9 pasando

---

### 🟢 NIVEL 2: SIMPLES (2-4 horas cada uno)

#### 5. **Playfair Cipher**
- **Tipo**: Sustitución de dígrafos
- **Complejidad**: ⭐⭐
- **Descripción**: Cifra pares de letras usando una matriz 5x5
- **Dificultad**: Media-Baja - requiere manejo de pares de letras y reglas especiales

#### 6. **Four-Square Cipher**
- **Tipo**: Sustitución de dígrafos
- **Complejidad**: ⭐⭐
- **Descripción**: Usa 4 cuadrados de Polybius para cifrar dígrafos
- **Dificultad**: Media-Baja - extensión de Polybius

#### 7. **Two-Square Cipher**
- **Tipo**: Sustitución de dígrafos
- **Complejidad**: ⭐⭐
- **Descripción**: Versión simplificada de Four-Square con 2 cuadrados
- **Dificultad**: Media-Baja

#### 8. **ADFGVX Cipher**
- **Tipo**: Sustitución + Transposición
- **Complejidad**: ⭐⭐⭐
- **Descripción**: Usa Polybius Square con coordenadas ADFGVX y luego transposición columnar
- **Dificultad**: Media - combina Polybius y transposición

#### 9. **ADFGX Cipher**
- **Tipo**: Sustitución + Transposición
- **Complejidad**: ⭐⭐⭐
- **Descripción**: Versión anterior de ADFGVX (sin V)
- **Dificultad**: Media

#### 10. **Rail Fence Cipher**
- **Tipo**: Transposición
- **Complejidad**: ⭐⭐
- **Descripción**: Escribe el texto en zigzag y lee por filas
- **Dificultad**: Baja - transposición simple

#### 11. **Route Cipher**
- **Tipo**: Transposición
- **Complejidad**: ⭐⭐
- **Descripción**: Escribe en una grilla y lee siguiendo una ruta específica
- **Dificultad**: Baja-Media

---

### 🟡 NIVEL 3: INTERMEDIOS (4-8 horas cada uno)

#### 12. **Hill Cipher**
- **Tipo**: Sustitución (Álgebra Lineal)
- **Complejidad**: ⭐⭐⭐⭐
- **Descripción**: Usa matrices para cifrar bloques de letras
- **Dificultad**: Media-Alta - requiere conocimiento de matrices y aritmética modular

#### 13. **Columnar Transposition Cipher**
- **Tipo**: Transposición
- **Complejidad**: ⭐⭐⭐
- **Descripción**: Escribe en filas, reordena columnas según clave, lee por columnas
- **Dificultad**: Media - similar a AMSCO pero más simple

#### 14. **Double Columnar Transposition**
- **Tipo**: Transposición
- **Complejidad**: ⭐⭐⭐
- **Descripción**: Aplica transposición columnar dos veces con diferentes claves
- **Dificultad**: Media - extensión de Columnar Transposition

#### 15. **Trifid Cipher**
- **Tipo**: Sustitución + Transposición
- **Complejidad**: ⭐⭐⭐
- **Descripción**: Extensión de Bifid usando 3 dimensiones (3x3x3)
- **Dificultad**: Media - similar a Bifid pero más complejo

#### 16. **Straddling Checkerboard**
- **Tipo**: Sustitución
- **Complejidad**: ⭐⭐⭐
- **Descripción**: Tabla de sustitución con algunas posiciones "straddling" para números
- **Dificultad**: Media

#### 17. **Nihilist Cipher**
- **Tipo**: Sustitución + Adición
- **Complejidad**: ⭐⭐⭐
- **Descripción**: Usa Polybius Square y suma coordenadas con una clave numérica
- **Dificultad**: Media

---

### 🟠 NIVEL 4: AVANZADOS (8-16 horas cada uno)

#### 18. **Vernam Cipher (One-Time Pad)**
- **Tipo**: Sustitución (XOR)
- **Complejidad**: ⭐⭐⭐⭐
- **Descripción**: XOR bit a bit con clave aleatoria del mismo tamaño
- **Dificultad**: Media-Alta - requiere manejo de bits/bytes

#### 19. **Running Key Cipher**
- **Tipo**: Polialfabético
- **Complejidad**: ⭐⭐⭐
- **Descripción**: Similar a Vigenère pero usa un texto largo como clave (ej: libro)
- **Dificultad**: Media

#### 20. **Chaocipher**
- **Tipo**: Sustitución dinámica
- **Complejidad**: ⭐⭐⭐⭐
- **Descripción**: Alfabetos que se permutan dinámicamente durante el cifrado
- **Dificultad**: Alta - requiere manejo complejo de permutaciones

#### 21. **Alberti Cipher**
- **Tipo**: Polialfabético
- **Complejidad**: ⭐⭐⭐
- **Descripción**: Primer cifrado polialfabético, usa disco con alfabetos
- **Dificultad**: Media-Alta

#### 22. **Jefferson Wheel Cipher**
- **Tipo**: Mecánico/Transposición
- **Complejidad**: ⭐⭐⭐⭐
- **Descripción**: Múltiples discos con alfabetos, alineación específica
- **Dificultad**: Alta

---

### 🔴 NIVEL 5: MUY COMPLEJOS (16+ horas cada uno)

#### 23. **Lorenz Cipher (SZ40/SZ42)**
- **Tipo**: Mecánico (Stream Cipher)
- **Complejidad**: ⭐⭐⭐⭐⭐
- **Descripción**: Máquina alemana de la WWII, más compleja que Enigma
- **Dificultad**: Muy Alta - requiere implementación de múltiples rotores y lógica compleja

#### 24. **Hagelin Cipher Machine (M-209)**
- **Tipo**: Mecánico
- **Complejidad**: ⭐⭐⭐⭐⭐
- **Descripción**: Máquina de cifrado portátil usada en WWII
- **Dificultad**: Muy Alta

#### 25. **Purple Cipher (Japanese)**
- **Tipo**: Mecánico
- **Complejidad**: ⭐⭐⭐⭐⭐
- **Descripción**: Máquina japonesa de la WWII
- **Dificultad**: Muy Alta

---

## 📊 Recomendaciones por Prioridad

### 🎯 Prioridad Alta (Fácil y Común)
1. **Beaufort Cipher** - Muy simple, complementa Vigenère
2. **Playfair Cipher** - Muy conocido, relativamente simple
3. **Rail Fence Cipher** - Simple, buen ejemplo de transposición
4. **Columnar Transposition** - Fundamental, complementa AMSCO
5. **Hill Cipher** - Importante históricamente, aunque requiere matemáticas

### 🎯 Prioridad Media
6. **Four-Square / Two-Square** - Extienden Polybius
7. **ADFGVX / ADFGX** - Históricamente importantes
8. **Bifid / Trifid** - Interesantes variaciones
9. **Running Key** - Variante útil de Vigenère

### 🎯 Prioridad Baja (Complejos o Especializados)
10. **Chaocipher** - Muy complejo
11. **Máquinas históricas** (Lorenz, Hagelin, Purple) - Muy complejas, nicho

---

## 💡 Sugerencia de Orden de Implementación

### ✅ Completados (Nivel 1)
1. ✅ **Beaufort** → 2. ✅ **Porta** → 3. ✅ **Gronsfeld** → 4. ✅ **Bifid**

### 📋 Próximos (Nivel 2)
5. **Rail Fence** → 6. **Playfair** → 7. **Columnar Transposition** → 
8. **Four-Square** → 9. **Two-Square** → 10. **ADFGVX** → 11. **ADFGX** → 12. **Route**

### 🔄 Siguientes (Nivel 3+)
13. **Hill** → 14. **Double Columnar Transposition** → 15. **Trifid** → 
16. **Straddling Checkerboard** → 17. **Nihilist** → 18. **Running Key** → 
19. **Vernam** → 20. **Chaocipher** → ...

