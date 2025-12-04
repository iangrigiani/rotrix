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

        this.dropSpeed = GAME_CONFIG.INITIAL_SPEED;
        this.gameOver = false;
        this.paused = false;
        
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
        this.piece.position.y = 0;

        this.logger.logPieceSpawn(this.piece, this.piece.position);

        if (this.board.checkCollision(this.piece, this.piece.position)) {
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
        
        if (!this.board.checkCollision(this.piece, newPos)) {
            this.piece.position = newPos;
            
            const moveType = dx < 0 ? 'LEFT' : dx > 0 ? 'RIGHT' : 'DOWN';
            this.logger.logPieceMove(this.piece, oldPos, newPos, moveType);
            
        } else if (dy > 0) {
            // Piece landed (moving down)
            this.logger.logPieceLanded(this.piece, this.piece.position);
            
            this.board.mergePiece(this.piece);
            this.piece.current = null;
            
            // Save board state BEFORE line clearing for animation
            const boardBeforeClear = this.board.fastClone();
            
            const linesCleared = this.board.checkLines();
            
            if (linesCleared > 0) {
                this.logger.logLinesCleared(
                    this.board.getLastClearedLines(), 
                    boardBeforeClear  // Use the saved state BEFORE clearing, not after
                );
                
                // Pass the pre-clear board state for correct animation
                await this.renderer.animateLinesClear(
                    this.board.getLastClearedLines(), 
                    Piece.COLORS,
                    boardBeforeClear
                );
                this.updateScore(GAME_CONFIG.LINE_POINTS[linesCleared] || 
                    GAME_CONFIG.LINE_POINTS[1] * linesCleared);
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
        
        if (this.board.checkCollision(this.piece, this.piece.position)) {
            this.piece.current = originalPiece;
        } else {
            this.logger.logPieceMove(this.piece, oldPos, this.piece.position, 'ROTATE');
        }
    }

    async hardDrop() {
        if (this.gameOver || !this.piece.current) {
            return;
        }

        // Find the lowest valid position (falling down)
        let currentPos = { ...this.piece.position };
        let nextPos = {
            x: currentPos.x,
            y: currentPos.y + 1
        };

        // Keep moving down until collision
        while (!this.board.checkCollision(this.piece, nextPos)) {
            currentPos = { ...nextPos };
            nextPos.y += 1;
        }

        // Move piece to the final valid position
        if (currentPos.y !== this.piece.position.y) {
            const oldPos = { ...this.piece.position };
            this.piece.position = currentPos;
            this.logger.logPieceMove(this.piece, oldPos, currentPos, 'HARD_DROP');
            
            // Trigger landing logic by calling movePiece down
            await this.movePiece(0, 1);
        }
    }


    endGame() {
        this.gameOver = true;
        this.piece.current = null;
        
        //this.logger.logGameOver(this.score, this.level, this.logger.pieceCounter);
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.logger.printSummary();
    }

    reset() {
        this.board.reset();
        this.gameOver = false;
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
        if (this.paused && !this.gameOver) {
            this.renderer.drawPaused();
        }
    }

    gameLoop(currentTime = 0) {
        if (this.gameOver) return;
        
        // Skip game updates when paused, but continue drawing
        if (!this.paused) {
            if (currentTime - this.lastDropTime >= this.dropSpeed) {
                this.movePiece(0, 1); // Move down
                this.updateScore(GAME_CONFIG.TICK_POINTS);
                this.lastDropTime = currentTime;
            }
        }
        
        this.draw();
        
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    togglePause() {
        if (this.gameOver) return;
        
        this.paused = !this.paused;
        this.logger.log('GAME_PAUSED', {
            paused: this.paused
        });
        
        if (this.paused) {
            console.log('[Game] Paused');
        } else {
            console.log('[Game] Resumed');
            // Reset drop timer to prevent instant drop on resume
            this.lastDropTime = performance.now();
        }
    }

    updateScore(points) {
        this.score += points;
        this.scoreDisplay.textContent = this.score;
        this.checkLevelUp();
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
    console.log('  - toggleConsoleLogging(): Activar/desactivar logs en consola');
    console.log('');
    console.log('Ejemplo: debugRotrix.getLastEvents(5)');
    console.log('También puedes acceder directamente: rotrixGame, rotrixLogger');
}; 