import { Board } from './game/Board.js';
import { Piece } from './game/Piece.js';
import { Controls } from './game/Controls.js';
import { Renderer } from './game/Renderer.js';
import { GameLogger } from './game/GameLogger.js';
import { GAME_CONFIG } from './config/gameConfig.js';

export class RotrixGame {
    constructor(
        width = GAME_CONFIG.DEFAULT_WIDTH, 
        height = GAME_CONFIG.DEFAULT_HEIGHT, 
        blockSize = GAME_CONFIG.DEFAULT_BLOCK_SIZE
    ) {
        this.canvas = document.getElementById('gameCanvas');
        this.nextPieceCanvas = document.getElementById('nextPieceCanvas');
        this.canvas.width = width * blockSize;
        this.canvas.height = height * blockSize;
        this.nextPieceCanvas.width = 120;
        this.nextPieceCanvas.height = 120;

        this.board = new Board(width, height);
        this.piece = new Piece();
        this.renderer = new Renderer(this.canvas, this.nextPieceCanvas, blockSize);
        this.controls = new Controls(this);
        this.logger = new GameLogger();

        this.piecesPlaced = 0;
        this.nextGravitySwitch = this.calculateNextGravitySwitch();
        this.gravity = 1;
        this.dropSpeed = GAME_CONFIG.INITIAL_SPEED;
        this.isInvertedMode = false;
        this.gameOver = false;
        this.switchingGravity = false;
        
        this.score = 0;
        this.level = 1;
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        
        this.lastDropTime = 0;
        this.animationFrameId = null;
        
        this.init();
    }

    calculateRequiredPoints(level) {
        return Math.floor(GAME_CONFIG.POINTS_BASE * 
            Math.pow(GAME_CONFIG.POINTS_MULTIPLIER, level - 1));
    }

    calculateSpeed(level) {
        return Math.max(
            GAME_CONFIG.SPEED_MIN,
            Math.floor(GAME_CONFIG.INITIAL_SPEED * 
                Math.pow(GAME_CONFIG.SPEED_MULTIPLIER, level - 1))
        );
    }

    checkLevelUp() {
        if (this.level >= GAME_CONFIG.MAX_LEVEL) return;

        const nextLevelPoints = this.calculateRequiredPoints(this.level + 1);
        if (this.score >= nextLevelPoints) {
            this.level++;
            this.levelDisplay.textContent = this.level;
            this.dropSpeed = this.calculateSpeed(this.level);
            
            this.renderer.showLevelUp(this.level, () => this.draw());
        }
    }

    init() {
        this.spawnPiece();
        this.gameLoop();
    }

    spawnPiece() {
        if (this.piece.current !== null) {
            this.logger.log('SPAWN_PREVENTED', {
                reason: 'Pieza actual ya existe',
                currentPiece: this.logger.getPieceTypeName(this.piece)
            });
            return false;
        }

        this.piece.spawn(this.board.width);
        this.piece.position.y = this.isInvertedMode ? 
            this.board.height - this.piece.current.length : 0;

        this.logger.logPieceSpawn(this.piece, this.piece.position, this.isInvertedMode);

        if (this.board.checkCollision(this.piece, this.piece.position, this.isInvertedMode)) {
            this.endGame();
            return false;
        }
        return true;
    }

    async movePiece(dx, dy) {
        if (this.gameOver) return;
        
        if (!this.piece.current) {
            return;
        }

        const oldPos = { ...this.piece.position };
        const newPos = {
            x: this.piece.position.x + dx,
            y: this.piece.position.y + dy
        };
        
        if (!this.board.checkCollision(this.piece, newPos, this.isInvertedMode)) {
            this.piece.position = newPos;
            
            const moveType = dx < 0 ? 'LEFT' : dx > 0 ? 'RIGHT' : 'DOWN';
            this.logger.logPieceMove(this.piece, oldPos, newPos, moveType);
            
        } else if (dy === this.gravity) {
            this.logger.logPieceLanded(this.piece, this.piece.position, this.isInvertedMode);
            
            // 🔧 DEBUG: Estado del board ANTES de mergePiece
            console.log('=== ANTES DE MERGE ===');
            console.log('Pieza a mergear:', this.logger.getPieceTypeName(this.piece));
            console.log('Posición:', this.piece.position);
            console.log('Board ANTES:');
            for (let y = 0; y < this.board.height; y++) {
                const row = this.board.grid[y];
                const rowStr = row.map(c => c || '.').join('');
                console.log(`Row ${y}: "${rowStr}"`);
            }
            
            this.board.mergePiece(this.piece);
            
            // 🔧 DEBUG: Estado del board DESPUÉS de mergePiece
            console.log('=== DESPUÉS DE MERGE ===');
            for (let y = 0; y < this.board.height; y++) {
                const row = this.board.grid[y];
                const rowStr = row.map(c => c || '.').join('');
                const isFull = row.every(cell => cell !== 0);
                console.log(`Row ${y}: "${rowStr}" (full: ${isFull})`);
            }
            
            this.piece.current = null;
            
            const linesCleared = this.board.checkLines(this.isInvertedMode);
            
            if (linesCleared > 0) {
                this.logger.logLinesCleared(
                    this.board.getLastClearedLines(), 
                    this.board, 
                    this.isInvertedMode
                );
                
                await this.renderer.animateLinesClear(
                    this.board.getLastClearedLines(), 
                    Piece.COLORS,
                    this.board
                );
                this.updateScore(GAME_CONFIG.LINE_POINTS[linesCleared] || 
                    GAME_CONFIG.LINE_POINTS[1] * linesCleared);
                
                // 🔧 FIX: NO aplicar gravedad aquí - checkLines() ya la aplicó
                // La doble aplicación de gravedad causaba el bug de duplicación de piezas
            }
            
            this.piecesPlaced++;
            
            if (this.piecesPlaced >= this.nextGravitySwitch) {
                await this.switchGravity();
                return;
            }
            
            if (!this.gameOver) {
                this.spawnPiece();
            }
        }
    }

    rotatePiece() {
        if (!this.piece.current) {
            return;
        }
        
        const rotated = this.piece.rotate();
        
        if (!rotated) {
            return;
        }
        
        const originalPiece = this.piece.current;
        const oldPos = { ...this.piece.position };
        
        this.piece.current = rotated;
        
        if (this.board.checkCollision(this.piece, this.piece.position, this.isInvertedMode)) {
            this.piece.current = originalPiece;
        } else {
            this.logger.logPieceMove(this.piece, oldPos, this.piece.position, 'ROTATE');
        }
    }

    async switchGravity() {
        if (this.switchingGravity) {
            this.logger.log('GRAVITY_SWITCH_PREVENTED', {
                reason: 'Cambio de gravedad ya en progreso'
            });
            return;
        }
        
        this.switchingGravity = true;
        
        const boardBefore = this.board.fastClone();
        const piecesPlacedSnapshot = this.piecesPlaced;
        
        this.isInvertedMode = !this.isInvertedMode;
        this.gravity = this.isInvertedMode ? -1 : 1;
        
        const nextPiece = this.piece.next;
        
        await this.renderer.animateGravitySwitch(this.board, this.isInvertedMode, Piece.COLORS);
        
        this.board.applyGravity(this.isInvertedMode);
        
        this.logger.logGravitySwitch(
            boardBefore, 
            this.board.grid, 
            this.isInvertedMode, 
            piecesPlacedSnapshot
        );
        
        this.piecesPlaced = 0;
        this.nextGravitySwitch = this.calculateNextGravitySwitch();
        
        this.piece.current = null;
        this.piece.next = nextPiece;
        
        if (!this.gameOver) {
            this.spawnPiece();
        }
        
        this.switchingGravity = false;
    }

    endGame() {
        this.gameOver = true;
        this.piece.current = null;
        
        this.logger.logGameOver(this.score, this.level, this.logger.pieceCounter);
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.logger.printSummary();
    }

    reset() {
        this.board.reset();
        this.piecesPlaced = 0;
        this.nextGravitySwitch = this.calculateNextGravitySwitch();
        this.isInvertedMode = false;
        this.gravity = 1;
        this.gameOver = false;
        this.switchingGravity = false;
        this.score = 0;
        this.level = 1;
        this.dropSpeed = GAME_CONFIG.INITIAL_SPEED;
        this.lastDropTime = 0;
        this.updateScore(0);
        this.levelDisplay.textContent = this.level;
        this.spawnPiece();
        this.draw();
        this.gameLoop();
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawBoard(this.board, Piece.COLORS);
        this.renderer.drawNextPiece(this.piece, Piece.COLORS);
        if (!this.gameOver && this.piece.current) {
            this.renderer.drawPiece(this.piece, Piece.COLORS);
        }
        if (this.gameOver) {
            this.renderer.drawGameOver();
        }
    }

    gameLoop(currentTime = 0) {
        if (this.gameOver) return;
        
        if (currentTime - this.lastDropTime >= this.dropSpeed) {
            this.movePiece(0, this.gravity);
            this.updateScore(GAME_CONFIG.TICK_POINTS);
            this.lastDropTime = currentTime;
        }
        
        this.draw();
        
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    updateScore(points) {
        this.score += points;
        this.scoreDisplay.textContent = this.score;
        this.checkLevelUp();
    }

    calculateNextGravitySwitch() {
        const min = GAME_CONFIG.GRAVITY_SWITCH.MIN_PIECES;
        const max = GAME_CONFIG.GRAVITY_SWITCH.MAX_PIECES;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

window.onload = () => {
    const game = new RotrixGame();
    
    // Hacer el juego y el logger accesibles globalmente para debugging
    window.rotrixGame = game;
    window.rotrixLogger = game.logger;
    
    // Comandos de debugging disponibles en la consola
    window.debugRotrix = {
        // Obtener los últimos N eventos
        getLastEvents: (count = 10) => game.logger.getLastEvents(count),
        
        // Obtener eventos por tipo
        getEventsByType: (type) => game.logger.getEventsByType(type),
        
        // Mostrar resumen del juego
        showSummary: () => game.logger.printSummary(),
        
        // Exportar logs a archivo
        exportLogs: () => game.logger.exportToFile(),
        
        // Mostrar estado actual del tablero
        showBoard: () => {
            console.log('=== ESTADO ACTUAL DEL TABLERO ===');
            console.log(game.logger.boardToString(game.board.grid));
            console.log(`Modo invertido: ${game.isInvertedMode}`);
            console.log(`Piezas colocadas: ${game.piecesPlaced}`);
            console.log(`Próximo cambio de gravedad: ${game.nextGravitySwitch}`);
        },
        
        // Mostrar información de la pieza actual
        showCurrentPiece: () => {
            if (game.piece.current) {
                console.log('=== PIEZA ACTUAL ===');
                console.log(`Tipo: ${game.logger.getPieceTypeName(game.piece)}`);
                console.log(`Posición: x=${game.piece.position.x}, y=${game.piece.position.y}`);
                console.log('Matriz:');
                console.log(game.logger.matrixToString(game.piece.current));
            } else {
                console.log('No hay pieza actual');
            }
        },
        
        // Análisis de líneas completadas
        analyzeLineClears: () => {
            const lineEvents = game.logger.getEventsByType('LINES_CLEARED');
            console.log('=== ANÁLISIS DE LÍNEAS COMPLETADAS ===');
            console.log(`Total de veces que se completaron líneas: ${lineEvents.length}`);
            
            const lineCounts = {};
            lineEvents.forEach(event => {
                const count = event.linesCleared;
                lineCounts[count] = (lineCounts[count] || 0) + 1;
            });
            
            Object.entries(lineCounts).forEach(([lines, times]) => {
                console.log(`  ${lines} línea(s): ${times} veces`);
            });
        },
        
        // Análisis de cambios de gravedad
        analyzeGravitySwitches: () => {
            const gravityEvents = game.logger.getEventsByType('GRAVITY_SWITCH');
            console.log('=== ANÁLISIS DE CAMBIOS DE GRAVEDAD ===');
            console.log(`Total cambios de gravedad: ${gravityEvents.length}`);
            
            gravityEvents.forEach((event, index) => {
                console.log(`Cambio ${index + 1}:`);
                console.log(`  Piezas colocadas: ${event.piecesPlaced}`);
                console.log(`  Modo anterior: ${event.oldGravityMode ? 'Invertido' : 'Normal'}`);
                console.log(`  Modo nuevo: ${event.newGravityMode ? 'Invertido' : 'Normal'}`);
            });
        },
        
        // Activar/desactivar logging en consola
        toggleConsoleLogging: () => {
            game.logger.logToConsole = !game.logger.logToConsole;
            console.log(`Logging en consola: ${game.logger.logToConsole ? 'ACTIVADO' : 'DESACTIVADO'}`);
        }
    };
    
    // Mostrar información de debugging disponible
    console.log('%c🎮 ROTRIX DEBUG MODE ACTIVADO 🎮', 'color: #00ff00; font-size: 16px; font-weight: bold;');
    console.log('Comandos disponibles en debugRotrix:');
    console.log('  - getLastEvents(n): Obtener últimos N eventos');
    console.log('  - getEventsByType(tipo): Filtrar eventos por tipo');
    console.log('  - showSummary(): Mostrar resumen del juego');
    console.log('  - exportLogs(): Exportar logs a archivo JSON');
    console.log('  - showBoard(): Mostrar estado actual del tablero');
    console.log('  - showCurrentPiece(): Mostrar información de pieza actual');
    console.log('  - analyzeLineClears(): Análisis de líneas completadas');
    console.log('  - analyzeGravitySwitches(): Análisis de cambios de gravedad');
    console.log('  - toggleConsoleLogging(): Activar/desactivar logs en consola');
    console.log('');
    console.log('Ejemplo: debugRotrix.getLastEvents(5)');
    console.log('También puedes acceder directamente: rotrixGame, rotrixLogger');
}; 