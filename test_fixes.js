// 🧪 Script de Testing para verificar correcciones de bugs
// Usar en la consola del navegador después de cargar el juego

// Helper function to display test results
function addTestResult(message, type) {
    const styles = {
        pass: 'color: #10b981; font-weight: bold;',
        fail: 'color: #ef4444; font-weight: bold;',
        warning: 'color: #f59e0b; font-weight: bold;'
    };
    console.log(`%c${message}`, styles[type] || '');
}

class BugTester {
    constructor() {
        this.stats = {
            spawns: 0,
            landed: 0,
            gravityChanges: 0,
            prevented: 0,
            doubleSpawns: 0,
            cascadeGravity: 0,
            testsPassed: 0,
            testsFailed: 0
        };
        
        this.lastSpawnTime = 0;
        this.lastGravityTime = 0;
        this.monitoring = false;
        
        console.log('🧪 Bug Tester inicializado');
        console.log('Comandos disponibles:');
        console.log('  - tester.startMonitoring() : Iniciar monitoreo');
        console.log('  - tester.runTests() : Ejecutar tests');
        console.log('  - tester.showStats() : Mostrar estadísticas');
        console.log('  - tester.simulatePlay(seconds) : Simular juego');
    }
    
    startMonitoring() {
        if (!window.rotrixGame) {
            console.error('❌ Juego no encontrado. Asegúrate de que rotrixGame esté cargado.');
            return;
        }
        
        this.monitoring = true;
        const game = window.rotrixGame;
        
        // Interceptar logs
        const originalLog = game.logger.log.bind(game.logger);
        game.logger.log = (eventType, data) => {
            originalLog(eventType, data);
            this.analyzeEvent(eventType, data);
        };
        
        console.log('✅ Monitoreo iniciado');
    }
    
    analyzeEvent(eventType, data) {
        if (!this.monitoring) return;
        
        switch(eventType) {
            case 'PIECE_SPAWN':
                this.stats.spawns++;
                this.checkDoubleSpawn(data);
                break;
                
            case 'PIECE_LANDED':
                this.stats.landed++;
                break;
                
            case 'GRAVITY_SWITCH':
                this.stats.gravityChanges++;
                this.checkGravityCascade(data);
                break;
                
            case 'SPAWN_PREVENTED':
                this.stats.prevented++;
                console.log(`✅ Spawn doble prevenido: ${data.reason}`);
                break;
                
            case 'GRAVITY_SWITCH_PREVENTED':
                console.log(`✅ Cambio de gravedad prevenido: ${data.reason}`);
                break;
        }
    }
    
    checkDoubleSpawn(data) {
        const now = performance.now();
        if (now - this.lastSpawnTime < 100) {
            this.stats.doubleSpawns++;
            console.error(`🚨 SPAWN DOBLE: Pieza #${data.pieceNumber} (${now - this.lastSpawnTime}ms)`);
            this.stats.testsFailed++;
        }
        this.lastSpawnTime = now;
    }
    
    checkGravityCascade(data) {
        const now = performance.now();
        if (data.piecesPlaced === 0 && now - this.lastGravityTime < 1000) {
            this.stats.cascadeGravity++;
            console.error(`🚨 GRAVEDAD EN CASCADA: piecesPlaced=${data.piecesPlaced}`);
            this.stats.testsFailed++;
        }
        this.lastGravityTime = now;
    }
    
    runTests() {
        console.log('🧪 Ejecutando tests de correcciones...');
        
        if (!window.rotrixGame) {
            console.error('❌ Juego no encontrado');
            return;
        }
        
        const game = window.rotrixGame;
        let passed = 0;
        let failed = 0;
        
        // Test 1: Verificar bandera de protección
        if (typeof game.switchingGravity === 'boolean') {
            console.log('✅ Test 1: Bandera switchingGravity existe');
            passed++;
        } else {
            console.error('❌ Test 1: Bandera switchingGravity no existe');
            failed++;
        }
        
        // Test 2: Verificar protección en spawnPiece
        const originalCurrent = game.piece.current;
        game.piece.current = { test: true }; // Simular pieza activa
        const spawnResult = game.spawnPiece();
        game.piece.current = originalCurrent;
        
        if (spawnResult === false) {
            console.log('✅ Test 2: Protección contra spawn doble funciona');
            passed++;
        } else {
            console.error('❌ Test 2: Protección contra spawn doble NO funciona');
            failed++;
        }
        
        // Test 3: Verificar que piecesPlaced no se resetea prematuramente
        const originalPieces = game.piecesPlaced;
        if (typeof originalPieces === 'number') {
            console.log('✅ Test 3: Contador piecesPlaced existe y es número');
            passed++;
        } else {
            console.error('❌ Test 3: Contador piecesPlaced problemático');
            failed++;
        }
        
        // Test 4: Verificar función switchGravity
        if (typeof game.switchGravity === 'function') {
            console.log('✅ Test 4: Función switchGravity existe');
            passed++;
        } else {
            console.error('❌ Test 4: Función switchGravity no existe');
            failed++;
        }
        
        // Test específico para el bug de líneas completas
        window.testLineDetection = function() {
            addTestResult('🔍 Testing detección de líneas completas...', 'warning');
            
            // Crear un tablero de prueba con línea incompleta
            const testBoard = [
                [0, 0, 3, 3, 3, 7, 5, 7, 7, 0], // Línea incompleta (tiene 0s)
                [0, 0, 0, 2, 2, 3, 2, 1, 0, 0], // Línea incompleta
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Línea vacía
            ];
            
            // Backup original
            const originalGrid = game.board.fastClone();
            
            // Aplicar test grid
            game.board.grid = testBoard;
            
            console.log('=== TEST LINE DETECTION ===');
            console.log('Board de prueba:');
            for (let y = 0; y < testBoard.length; y++) {
                const row = testBoard[y];
                const rowStr = row.map(c => c || '.').join('');
                const isFull = row.every(cell => cell !== 0);
                console.log(`Row ${y}: "${rowStr}" (full: ${isFull})`);
            }
            
            // Test checkLines
            const linesCleared = game.board.checkLines(game.isInvertedMode);
            
            if (linesCleared === 0) {
                addTestResult('✅ Detección de líneas correcta - no detectó líneas incompletas como completas', 'pass');
            } else {
                addTestResult(`❌ BUG DETECTADO: Se detectaron ${linesCleared} líneas como completas cuando no lo están`, 'fail');
            }
            
            // Restaurar grid original
            game.board.grid = originalGrid;
        };
        
        // Test con línea realmente completa
        window.testRealFullLine = function() {
            addTestResult('🔍 Testing línea realmente completa...', 'warning');
            
            const testBoard = [
                [1, 2, 3, 4, 5, 6, 7, 1, 2, 3], // Línea completa (sin 0s)
                [0, 0, 0, 2, 2, 3, 2, 1, 0, 0], // Línea incompleta
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Línea vacía
            ];
            
            const originalGrid = game.board.fastClone();
            game.board.grid = testBoard;
            
            const linesCleared = game.board.checkLines(game.isInvertedMode);
            
            if (linesCleared === 1) {
                addTestResult('✅ Detección correcta de línea realmente completa', 'pass');
            } else {
                addTestResult(`❌ Error: Se detectaron ${linesCleared} líneas en lugar de 1`, 'fail');
            }
            
            game.board.grid = originalGrid;
        };
        
        // Test específico para el bug de gravedad en modo invertido  
        window.testInvertedGravityBug = function() {
            addTestResult('🔄 Testing bug de gravedad en modo invertido...', 'warning');
            
            // Recrear el escenario exacto del log
            const testBoard = [
                [1, 1, 1, 3, 2, 0, 7, 7, 0, 1], // Fila 0 
                [4, 1, 1, 0, 7, 7, 5, 5, 0, 0], // Fila 1 - línea completa original
                [0, 0, 0, 0, 7, 0, 0, 0, 0, 0], // Fila 2
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Fila 3
                // ... resto vacías
            ];
            
            // Completar el resto del tablero con filas vacías
            for (let i = 4; i < 20; i++) {
                testBoard.push(Array(10).fill(0));
            }
            
            // Hacer la fila 1 completa para simular la eliminación
            testBoard[1] = [4, 1, 1, 2, 7, 7, 5, 5, 3, 6]; // Línea completa
            
            const originalGrid = game.board.fastClone();
            
            // Aplicar test grid
            game.board.grid = testBoard;
            
            console.log('=== TEST INVERTED GRAVITY BUG ===');
            console.log('ANTES de eliminar línea:');
            for (let y = 0; y < 3; y++) {
                const row = testBoard[y];
                const rowStr = row.map(c => c || '.').join('');
                console.log(`Row ${y}: "${rowStr}"`);
            }
            
            // Simular modo invertido
            const wasInverted = game.isInvertedMode;
            game.isInvertedMode = true;
            
            // Test checkLines en modo invertido
            const linesCleared = game.board.checkLines(true);
            
            console.log('DESPUÉS de eliminar línea + aplicar gravedad:');
            for (let y = 0; y < 3; y++) {
                const row = game.board.grid[y];
                const rowStr = row.map(c => c || '.').join('');
                console.log(`Row ${y}: "${rowStr}"`);
            }
            
            // Verificar resultado esperado
            const row0 = game.board.grid[0].map(c => c || '.').join('');
            const row1 = game.board.grid[1].map(c => c || '.').join('');
            
            // En modo invertido, las piezas de fila 0 deberían "caer" hacia fila 1
            // y fila 0 debería tener menos piezas o estar más vacía
            
            if (linesCleared === 1) {
                addTestResult('✅ Línea detectada y eliminada correctamente', 'pass');
                
                // Verificar que no hay duplicación de piezas
                const originalPieces = [1,1,1,3,2,7,7,1,7].filter(p => p !== 0); // Piezas originales en fila 0 + fila 2
                const finalPieces = [];
                for (let y = 0; y < 3; y++) {
                    for (let x = 0; x < 10; x++) {
                        if (game.board.grid[y][x] !== 0) {
                            finalPieces.push(game.board.grid[y][x]);
                        }
                    }
                }
                
                if (finalPieces.length <= originalPieces.length) {
                    addTestResult('✅ No hay duplicación de piezas - gravedad correcta', 'pass');
                } else {
                    addTestResult(`❌ DUPLICACIÓN DETECTADA: ${originalPieces.length} → ${finalPieces.length} piezas`, 'fail');
                }
                
                // Verificar que fila 1 tiene las piezas que "cayeron" de fila 0
                const row1PieceCount = game.board.grid[1].filter(c => c !== 0).length;
                if (row1PieceCount > 0) {
                    addTestResult('✅ Piezas correctamente movidas hacia abajo en fila 1', 'pass');
                } else {
                    addTestResult('❌ Las piezas no se movieron correctamente', 'fail');
                }
                
            } else {
                addTestResult(`❌ Error: Se detectaron ${linesCleared} líneas en lugar de 1`, 'fail');
            }
            
            // Restaurar estado
            game.board.grid = originalGrid;
            game.isInvertedMode = wasInverted;
        };
        
        // Test específico para el bug de líneas completas recursivas
        window.testRecursiveLineDetection = function() {
            addTestResult('🔄 Testing detección recursiva de líneas completas...', 'warning');
            
            // Crear un escenario donde después de eliminar una línea y aplicar gravedad,
            // se forme una nueva línea completa
            const testBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
            
            // Configurar el escenario:
            // Fila 18: línea completa que se eliminará primero
            testBoard[18] = [1, 2, 3, 4, 5, 6, 7, 1, 2, 3];
            
            // Fila 17: casi completa (le falta 1 pieza)
            testBoard[17] = [1, 2, 3, 4, 5, 6, 7, 1, 2, 0];
            
            // Fila 16: tiene 1 pieza que completará la fila 17 al caer
            testBoard[16] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 3];
            
            // Resto vacío (filas 0-15, 19)
            
            const originalGrid = game.board.fastClone();
            
            console.log('=== TEST RECURSIVE LINE DETECTION ===');
            console.log('Estado inicial (solo mostrando filas relevantes):');
            for (let y = 16; y <= 18; y++) {
                const row = testBoard[y];
                const rowStr = row.map(c => c || '.').join('');
                const isFull = row.every(cell => cell !== 0);
                console.log(`Row ${y}: "${rowStr}" (full: ${isFull})`);
            }
            
            // Aplicar test grid
            game.board.grid = testBoard;
            
            // Simular modo normal (no invertido)
            const wasInverted = game.isInvertedMode;
            game.isInvertedMode = false;
            
            // Ejecutar checkLines
            const totalLinesCleared = game.board.checkLines(false);
            
            console.log('Estado final:');
            for (let y = 16; y <= 19; y++) {
                const row = game.board.grid[y];
                const rowStr = row.map(c => c || '.').join('');
                const isFull = row.every(cell => cell !== 0);
                console.log(`Row ${y}: "${rowStr}" (full: ${isFull})`);
            }
            
            // Verificar resultado
            if (totalLinesCleared === 2) {
                addTestResult('✅ Detección recursiva correcta: 2 líneas eliminadas', 'pass');
                
                // Verificar que no quedan líneas completas
                let remainingFullLines = 0;
                for (let y = 0; y < game.board.height; y++) {
                    if (game.board.grid[y].every(cell => cell !== 0)) {
                        remainingFullLines++;
                    }
                }
                
                if (remainingFullLines === 0) {
                    addTestResult('✅ No quedan líneas completas sin eliminar', 'pass');
                } else {
                    addTestResult(`❌ FALLÓ: Quedan ${remainingFullLines} líneas completas sin eliminar`, 'fail');
                }
            } else {
                addTestResult(`❌ FALLÓ: Se eliminaron ${totalLinesCleared} líneas, esperaban 2`, 'fail');
            }
            
            // Restaurar estado original
            game.board.grid = originalGrid;
            game.isInvertedMode = wasInverted;
        };
        
        // Test específico para el bug en modo invertido
        window.testInvertedRecursiveLines = function() {
            addTestResult('🔄 Testing líneas recursivas en modo invertido...', 'warning');
            
            const testBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
            
            // En modo invertido, las piezas "caen" hacia arriba (y=0)
            // Fila 1: línea completa que se eliminará primero
            testBoard[1] = [1, 2, 3, 4, 5, 6, 7, 1, 2, 3];
            
            // Fila 2: casi completa (le falta 1 pieza)
            testBoard[2] = [1, 2, 3, 4, 5, 6, 7, 1, 2, 0];
            
            // Fila 3: tiene 1 pieza que completará la fila 2 al caer hacia arriba
            testBoard[3] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 3];
            
            const originalGrid = game.board.fastClone();
            
            console.log('=== TEST INVERTED RECURSIVE LINES ===');
            console.log('Estado inicial (modo invertido):');
            for (let y = 1; y <= 3; y++) {
                const row = testBoard[y];
                const rowStr = row.map(c => c || '.').join('');
                const isFull = row.every(cell => cell !== 0);
                console.log(`Row ${y}: "${rowStr}" (full: ${isFull})`);
            }
            
            // Aplicar test grid
            game.board.grid = testBoard;
            
            // Simular modo invertido
            const wasInverted = game.isInvertedMode;
            game.isInvertedMode = true;
            
            // Ejecutar checkLines en modo invertido
            const totalLinesCleared = game.board.checkLines(true);
            
            console.log('Estado final (modo invertido):');
            for (let y = 0; y <= 4; y++) {
                const row = game.board.grid[y];
                const rowStr = row.map(c => c || '.').join('');
                const isFull = row.every(cell => cell !== 0);
                console.log(`Row ${y}: "${rowStr}" (full: ${isFull})`);
            }
            
            // Verificar resultado
            if (totalLinesCleared === 2) {
                addTestResult('✅ Detección recursiva en modo invertido correcta: 2 líneas eliminadas', 'pass');
                
                // Verificar que no quedan líneas completas  
                let remainingFullLines = 0;
                for (let y = 0; y < game.board.height; y++) {
                    if (game.board.grid[y].every(cell => cell !== 0)) {
                        remainingFullLines++;
                    }
                }
                
                if (remainingFullLines === 0) {
                    addTestResult('✅ No quedan líneas completas sin eliminar en modo invertido', 'pass');
                } else {
                    addTestResult(`❌ FALLÓ: Quedan ${remainingFullLines} líneas completas sin eliminar en modo invertido`, 'fail');
                }
            } else {
                addTestResult(`❌ FALLÓ: Se eliminaron ${totalLinesCleared} líneas en modo invertido, esperaban 2`, 'fail');
            }
            
            // Restaurar estado original
            game.board.grid = originalGrid;
            game.isInvertedMode = wasInverted;
        };
        
        // Test específico para verificar que la gravedad NO crea líneas completas nuevas
        window.testGravityDoesNotCreateLines = function() {
            addTestResult('🔍 Testing que gravedad NO crea líneas completas nuevas...', 'warning');
            
            // Crear un escenario real donde se elimina una línea
            const testBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
            
            // Fila 18: línea completa que se eliminará
            testBoard[18] = [1, 2, 3, 4, 5, 6, 7, 1, 2, 3];
            
            // Filas 16-17: con piezas distribuidas de manera que NO puedan formar línea completa
            testBoard[17] = [1, 0, 3, 0, 5, 0, 7, 0, 2, 0]; // Solo 5 piezas
            testBoard[16] = [0, 2, 0, 4, 0, 6, 0, 1, 0, 3]; // Solo 5 piezas
            
            const originalGrid = game.board.fastClone();
            
            console.log('=== TEST GRAVITY CORRECTNESS ===');
            console.log('Estado inicial (filas relevantes):');
            for (let y = 16; y <= 18; y++) {
                const row = testBoard[y];
                const rowStr = row.map(c => c || '.').join('');
                const isFull = row.every(cell => cell !== 0);
                const pieceCount = row.filter(c => c !== 0).length;
                console.log(`Row ${y}: "${rowStr}" (full: ${isFull}, pieces: ${pieceCount})`);
            }
            
            // Aplicar test grid
            game.board.grid = testBoard;
            
            // Contar piezas totales ANTES
            let totalPiecesBefore = 0;
            for (let y = 0; y < game.board.height; y++) {
                totalPiecesBefore += game.board.grid[y].filter(c => c !== 0).length;
            }
            console.log(`Total piezas ANTES: ${totalPiecesBefore}`);
            
            // Ejecutar checkLines en modo normal
            const wasInverted = game.isInvertedMode;
            game.isInvertedMode = false;
            
            const linesCleared = game.board.checkLines(false);
            
            // Contar piezas totales DESPUÉS
            let totalPiecesAfter = 0;
            let newFullLines = 0;
            for (let y = 0; y < game.board.height; y++) {
                const pieces = game.board.grid[y].filter(c => c !== 0).length;
                totalPiecesAfter += pieces;
                
                if (game.board.grid[y].every(cell => cell !== 0)) {
                    newFullLines++;
                    console.error(`❌ Nueva línea completa detectada en fila ${y}!`);
                }
            }
            
            console.log(`Total piezas DESPUÉS: ${totalPiecesAfter}`);
            console.log(`Piezas esperadas: ${totalPiecesBefore - 10} (menos las 10 de la línea eliminada)`);
            
            // Verificar resultados
            const expectedPieces = totalPiecesBefore - 10; // Menos las piezas de la línea eliminada
            
            if (linesCleared === 1) {
                addTestResult('✅ Se eliminó exactamente 1 línea', 'pass');
            } else {
                addTestResult(`❌ Se eliminaron ${linesCleared} líneas, esperaba 1`, 'fail');
            }
            
            if (totalPiecesAfter === expectedPieces) {
                addTestResult('✅ Conteo de piezas correcto después de gravedad', 'pass');
            } else {
                addTestResult(`❌ Conteo incorrecto: ${totalPiecesAfter} vs ${expectedPieces} esperadas`, 'fail');
            }
            
            if (newFullLines === 0) {
                addTestResult('✅ No se formaron líneas completas nuevas (correcto)', 'pass');
            } else {
                addTestResult(`❌ ERROR CRÍTICO: Se formaron ${newFullLines} líneas completas nuevas`, 'fail');
            }
            
            // Restaurar estado original
            game.board.grid = originalGrid;
            game.isInvertedMode = wasInverted;
        };
        
        console.log(`\n📊 Resultados: ${passed} ✅ | ${failed} ❌`);
        this.stats.testsPassed += passed;
        this.stats.testsFailed += failed;
        
        return { passed, failed };
    }
    
    simulatePlay(seconds = 30) {
        if (!window.rotrixGame) {
            console.error('❌ Juego no encontrado');
            return;
        }
        
        console.log(`🤖 Simulando juego por ${seconds} segundos...`);
        
        const game = window.rotrixGame;
        let duration = seconds * 1000;
        
        const interval = setInterval(() => {
            if (game.gameOver) {
                clearInterval(interval);
                console.log('🔴 Juego terminado durante simulación');
                this.showStats();
                return;
            }
            
            // Simular caída rápida
            game.movePiece(0, game.gravity);
            
            duration -= 100;
            if (duration <= 0) {
                clearInterval(interval);
                console.log('🏁 Simulación completada');
                this.showStats();
            }
        }, 100);
    }
    
    showStats() {
        console.log('\n📊 === ESTADÍSTICAS DE TESTING ===');
        console.log(`Piezas spawneadas: ${this.stats.spawns}`);
        console.log(`Piezas aterrizadas: ${this.stats.landed}`);
        console.log(`Cambios de gravedad: ${this.stats.gravityChanges}`);
        console.log(`Spawns prevenidos: ${this.stats.prevented}`);
        console.log(`Tests pasados: ${this.stats.testsPassed}`);
        console.log(`Tests fallidos: ${this.stats.testsFailed}`);
        
        console.log('\n🚨 === BUGS DETECTADOS ===');
        console.log(`Spawns dobles: ${this.stats.doubleSpawns}`);
        console.log(`Cambios de gravedad en cascada: ${this.stats.cascadeGravity}`);
        
        // Calcular ratios
        const spawnRatio = this.stats.spawns > 0 ? (this.stats.landed / this.stats.spawns) : 0;
        console.log(`\n📈 Ratio spawn/aterrizaje: ${(spawnRatio * 100).toFixed(1)}%`);
        
        if (this.stats.doubleSpawns === 0 && this.stats.cascadeGravity === 0) {
            console.log('🎉 ¡NO SE DETECTARON BUGS CRÍTICOS!');
        } else {
            console.error('⚠️ Se detectaron bugs críticos');
        }
    }
    
    reset() {
        this.stats = {
            spawns: 0,
            landed: 0,
            gravityChanges: 0,
            prevented: 0,
            doubleSpawns: 0,
            cascadeGravity: 0,
            testsPassed: 0,
            testsFailed: 0
        };
        console.log('🔄 Estadísticas reseteadas');
    }
}

// Inicializar tester global
if (typeof window !== 'undefined') {
    window.tester = new BugTester();
    
    // Auto-iniciar monitoreo si el juego ya está cargado
    if (window.rotrixGame) {
        window.tester.startMonitoring();
    }
}

// Exportar para uso en Node.js si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BugTester;
} 