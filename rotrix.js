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
        
        // Calculate responsive block size for mobile - ensure it fits on screen
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Calculate available space accounting for header, padding, and controls
            // Use dynamic viewport height (dvh) which accounts for mobile browser UI
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)')) || 0;
            const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0;
            
            // More accurate measurements for mobile
            const headerHeight = 50; // Compact header height
            const controlsHeight = 120; // Mobile controls (2 rows of buttons)
            const spacing = 15; // Total spacing between elements
            
            const availableWidth = Math.min(window.innerWidth - 20, 500);
            const availableHeight = viewportHeight - headerHeight - controlsHeight - spacing - safeAreaTop - safeAreaBottom;
            
            // Calculate block size based on both width and height constraints
            const blockSizeByWidth = Math.floor(availableWidth / width);
            const blockSizeByHeight = Math.floor(availableHeight / height);
            
            // Use the smaller block size to ensure it fits both dimensions
            this.blockSize = Math.min(blockSizeByWidth, blockSizeByHeight, blockSize);
            
            // Ensure minimum block size for playability
            this.blockSize = Math.max(this.blockSize, 15);
        } else {
            this.blockSize = blockSize;
        }
        
        this.canvas.width = width * this.blockSize;
        this.canvas.height = height * this.blockSize;
        this.nextPieceCanvas.width = isMobile ? Math.min(70, this.blockSize * 4) : 120;
        this.nextPieceCanvas.height = isMobile ? Math.min(70, this.blockSize * 4) : 120;
        
        // Set canvas display size - use CSS to scale if needed
        this.canvas.style.width = '100%';
        this.canvas.style.height = 'auto';
        this.canvas.style.maxWidth = `${this.canvas.width}px`;
        this.canvas.style.maxHeight = `${this.canvas.height}px`;

        this.board = new Board(width, height);
        this.piece = new Piece();
        this.renderer = new Renderer(this.canvas, this.nextPieceCanvas, this.blockSize);
        this.controls = new Controls(this);
        this.logger = new GameLogger();

        this.dropSpeed = GAME_CONFIG.INITIAL_SPEED;
        this.gameOver = false;
        this.paused = false;
        this.showingQuitConfirmation = false; // Track if showing quit confirmation dialog
        
        this.score = 0;
        this.level = 1;
        this.totalLines = 0;
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.linesDisplay = document.getElementById('linesDisplay');
        
        this.lastDropTime = 0;
        this.animationFrameId = null;
        
        // Gravity flipping system
        this.gravityDown = true; // true = pieces fall down, false = pieces fall up
        this.spawnCount = 0;
        this.spawnsUntilFlip = this.generateSpawnsUntilFlip();
        this.isFlippingGravity = false; // Flag to prevent actions during flip animation
        
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

    generateSpawnsUntilFlip() {
        return Math.floor(Math.random() * (18 - 8 + 1)) + 8; // Random between 8 and 18
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
        
        // Spawn at top if gravity is down, at bottom if gravity is up
        if (this.gravityDown) {
            this.piece.position.y = 0;
        } else {
            // Spawn at bottom, accounting for piece height
            this.piece.position.y = this.board.height - this.piece.current.length;
        }

        this.logger.logPieceSpawn(this.piece, this.piece.position);

        if (this.board.checkCollision(this.piece, this.piece.position, this.gravityDown)) {
            this.endGame();
            return false;
        }
        
        // Increment spawn count and check if gravity should flip
        this.spawnCount++;
        if (this.spawnCount >= this.spawnsUntilFlip) {
            this.spawnCount = 0;
            this.spawnsUntilFlip = this.generateSpawnsUntilFlip();
            // Flip gravity asynchronously (will hide piece during animation)
            this.flipGravity();
        }
        
        return true;
    }

    async movePiece(dx, dy) {
        if (this.gameOver || this.isFlippingGravity) return;
        
        if (!this.piece.current) {
            return;
        }

        const oldPos = { ...this.piece.position };
        const newPos = {
            x: this.piece.position.x + dx,
            y: this.piece.position.y + dy
        };
        
        // Determine if this is a gravity movement (down or up based on gravity direction)
        const isGravityMove = (this.gravityDown && dy > 0) || (!this.gravityDown && dy < 0);
        
        if (!this.board.checkCollision(this.piece, newPos, this.gravityDown)) {
            this.piece.position = newPos;
            
            const moveType = dx < 0 ? 'LEFT' : dx > 0 ? 'RIGHT' : 
                           (this.gravityDown ? 'DOWN' : 'UP');
            this.logger.logPieceMove(this.piece, oldPos, newPos, moveType);
            
            // Haptic feedback for manual moves (not gravity)
            if (!isGravityMove && window.HapticService) {
                window.HapticService.gameAction().catch(() => {});
            }
            
        } else if (isGravityMove) {
            // Piece landed (moving in gravity direction)
            this.logger.logPieceLanded(this.piece, this.piece.position);
            
            this.board.mergePiece(this.piece);
            this.piece.current = null;
            
            // Save board state BEFORE line clearing for animation
            const boardBeforeClear = this.board.fastClone();
            
            const linesCleared = this.board.checkLines(this.gravityDown);
            
            if (linesCleared > 0) {
                this.logger.logLinesCleared(
                    this.board.getLastClearedLines(), 
                    boardBeforeClear  // Use the saved state BEFORE clearing, not after
                );
                
                // Haptic feedback for line clear
                if (window.HapticService) {
                    window.HapticService.lineClear().catch(() => {});
                }
                
                // Pass the pre-clear board state for correct animation
                await this.renderer.animateLinesClear(
                    this.board.getLastClearedLines(), 
                    Piece.COLORS,
                    boardBeforeClear
                );
                this.updateScore(GAME_CONFIG.LINE_POINTS[linesCleared] || 
                    GAME_CONFIG.LINE_POINTS[1] * linesCleared);
                this.updateLines(linesCleared);
            }
            
            if (!this.gameOver) {
                this.spawnPiece();
            }
        }
    }

    rotatePiece() {
        if (!this.piece.current || this.isFlippingGravity) {
            return;
        }
        
        const rotated = this.piece.rotate();
        
        if (!rotated) {
            return;
        }
        
        const originalPiece = this.piece.current;
        const oldPos = { ...this.piece.position };
        
        this.piece.current = rotated;
        
        if (this.board.checkCollision(this.piece, this.piece.position, this.gravityDown)) {
            this.piece.current = originalPiece;
        } else {
            this.logger.logPieceMove(this.piece, oldPos, this.piece.position, 'ROTATE');
            // Haptic feedback for rotation
            if (window.HapticService) {
                window.HapticService.gameAction().catch(() => {});
            }
        }
    }

    async hardDrop() {
        if (this.gameOver || !this.piece.current || this.isFlippingGravity) {
            return;
        }

        // Find the furthest valid position in gravity direction
        let currentPos = { ...this.piece.position };
        const gravityDy = this.gravityDown ? 1 : -1;
        let nextPos = {
            x: currentPos.x,
            y: currentPos.y + gravityDy
        };

        // Keep moving in gravity direction until collision
        while (!this.board.checkCollision(this.piece, nextPos, this.gravityDown)) {
            currentPos = { ...nextPos };
            nextPos.y += gravityDy;
        }

        // Move piece to the final valid position
        if (currentPos.y !== this.piece.position.y) {
            const oldPos = { ...this.piece.position };
            this.piece.position = currentPos;
            this.logger.logPieceMove(this.piece, oldPos, currentPos, 'HARD_DROP');
            
            // Trigger landing logic by calling movePiece in gravity direction
            await this.movePiece(0, gravityDy);
        }
    }


    endGame() {
        this.gameOver = true;
        this.piece.current = null;
        
        // Haptic feedback for game over
        if (window.HapticService) {
            window.HapticService.gameOver().catch(() => {});
        }
        
        //this.logger.logGameOver(this.score, this.level, this.logger.pieceCounter);
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.logger.printSummary();
    }

    reset() {
        this.board.reset();
        this.gameOver = false;
        this.paused = false;
        this.showingQuitConfirmation = false;
        this.score = 0;
        this.level = 1;
        this.totalLines = 0;
        this.dropSpeed = GAME_CONFIG.INITIAL_SPEED;
        this.lastDropTime = 0;
        this.gravityDown = true;
        this.spawnCount = 0;
        this.spawnsUntilFlip = this.generateSpawnsUntilFlip();
        this.isFlippingGravity = false;
        this.updateScore(0);
        this.updateLines(0);
        this.levelDisplay.textContent = this.level;
        this.spawnPiece();
        this.draw();
        this.gameLoop();
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawBoard(this.board, Piece.COLORS);
        this.renderer.drawNextPiece(this.piece, Piece.COLORS);
        // Don't draw piece during gravity flip animation
        if (!this.gameOver && this.piece.current && !this.isFlippingGravity) {
            this.renderer.drawPiece(this.piece, Piece.COLORS);
        }
        if (this.gameOver) {
            this.renderer.drawGameOver();
        }
        if (this.paused && !this.gameOver) {
            if (this.showingQuitConfirmation) {
                this.renderer.drawQuitConfirmation();
            } else {
                this.renderer.drawPaused();
            }
        }
    }

    gameLoop(currentTime = 0) {
        if (this.gameOver) return;
        
        // Skip game updates when paused or flipping gravity, but continue drawing
        if (!this.paused && !this.isFlippingGravity) {
            if (currentTime - this.lastDropTime >= this.dropSpeed) {
                // Move in gravity direction
                const gravityDy = this.gravityDown ? 1 : -1;
                this.movePiece(0, gravityDy);
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
            // Clear quit confirmation when resuming
            this.showingQuitConfirmation = false;
            // Reset drop timer to prevent instant drop on resume
            this.lastDropTime = performance.now();
        }
    }
    
    resumeFromQuitConfirmation() {
        // Resume game and hide quit confirmation
        if (this.paused && this.showingQuitConfirmation) {
            this.showingQuitConfirmation = false;
            this.paused = false;
            this.lastDropTime = performance.now();
            console.log('[Game] Resumed from quit confirmation');
        }
    }
    
    showQuitConfirmation() {
        // Pause game and show quit confirmation
        if (!this.paused && !this.gameOver) {
            this.paused = true;
            this.showingQuitConfirmation = true;
            this.logger.log('GAME_PAUSED', {
                paused: true,
                reason: 'quit_confirmation'
            });
            console.log('[Game] Paused - Showing quit confirmation');
        }
    }
    
    hideQuitConfirmation() {
        // Hide quit confirmation (but keep paused state)
        this.showingQuitConfirmation = false;
    }

    updateScore(points) {
        this.score += points;
        this.scoreDisplay.textContent = this.score;
        this.checkLevelUp();
    }

    updateLines(linesCleared) {
        this.totalLines += linesCleared;
        if (this.linesDisplay) {
            this.linesDisplay.textContent = this.totalLines;
        }
    }

    async flipGravity() {
        if (this.isFlippingGravity) return;
        
        this.isFlippingGravity = true;
        
        // Hide current piece during animation
        const savedPiece = this.piece.current;
        const savedPiecePos = { ...this.piece.position };
        this.piece.current = null;
        
        // Save old gravity direction for animation
        const oldGravityDown = this.gravityDown;
        
        // Save BEFORE state visualization
        //const beforeVisualization = this.board.visualizePieceIdGrid();
        
        // Flip gravity direction first (animation will use new direction)
        this.gravityDown = !this.gravityDown;
        
        // Haptic feedback for gravity flip
        if (window.HapticService) {
            window.HapticService.gravityFlip().catch(() => {});
        }
        
        // Animate pieces falling to the opposite side
        // The animation updates the board as pieces fall
        await this.renderer.animateGravityFlip(this.board, Piece.COLORS, oldGravityDown);
        
        // Save AFTER state visualization
        //const afterVisualization = this.board.visualizePieceIdGrid();
        
        // Create comparison file with both states
        //this.createComparisonFile(beforeVisualization, afterVisualization);
        
        // After all pieces have fallen, check for complete lines
        // Save board state BEFORE line clearing for animation
        const boardBeforeClear = this.board.fastClone();
        
        const linesCleared = this.board.checkLines(this.gravityDown);
        
        if (linesCleared > 0) {
            this.logger.logLinesCleared(
                this.board.getLastClearedLines(), 
                boardBeforeClear
            );
            
            // Haptic feedback for line clear after gravity flip
            if (window.HapticService) {
                window.HapticService.lineClear().catch(() => {});
            }
            
            // Animate line clearing
            await this.renderer.animateLinesClear(
                this.board.getLastClearedLines(), 
                Piece.COLORS,
                boardBeforeClear
            );
            this.updateScore(GAME_CONFIG.LINE_POINTS[linesCleared] || 
                GAME_CONFIG.LINE_POINTS[1] * linesCleared);
            this.updateLines(linesCleared);
        }
        
        // Restore piece and adjust its position
        this.piece.current = savedPiece;
        if (savedPiece) {
            // Adjust piece position based on new gravity
            if (this.gravityDown) {
                // Gravity flipped to down: piece should be at top
                this.piece.position.y = 0;
            } else {
                // Gravity flipped to up: piece should be at bottom
                this.piece.position.y = this.board.height - this.piece.current.length;
            }
            this.piece.position.x = savedPiecePos.x;
            
            // Check if new position is valid
            if (this.board.checkCollision(this.piece, this.piece.position, this.gravityDown)) {
                this.endGame();
                return;
            }
        }
        
        this.isFlippingGravity = false;
        this.draw();
        
        // Update mobile control buttons if they exist
        if (typeof updateGravityButtons === 'function') {
            updateGravityButtons();
        }
    }

    createComparisonFile(beforeVisualization, afterVisualization) {
        try {
            if (!beforeVisualization || !afterVisualization) return;
            
            const comparison = `
================================================================================
PIECE ID GRID COMPARISON - GRAVITY FLIP
================================================================================
Generated: ${new Date().toISOString()}
Gravity Direction Changed To: ${this.gravityDown ? 'DOWN' : 'UP'}

================================================================================
BEFORE GRAVITY CHANGE:
================================================================================
${beforeVisualization}

================================================================================
AFTER GRAVITY CHANGE (All pieces settled):
================================================================================
${afterVisualization}

================================================================================
NOTES:
- Piece IDs are shown as 2-digit numbers (01, 02, 03, etc.)
- Empty cells are shown as " . "
- Each piece ID represents a rigid body (blocks from the same original piece)
- Compare the two grids to see how pieces moved during gravity flip
- Piece IDs should remain the same, only positions change
================================================================================
`;
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const blob = new Blob([comparison], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `pieceId-comparison-${timestamp}.txt`;
            link.click();
            
            console.log(`📊 Comparison file exported: pieceId-comparison-${timestamp}.txt`);
        } catch (e) {
            console.error('Error creating comparison file:', e);
        }
    }

    async forceGravityFlip() {
        // Force gravity flip and reset spawn counter
        // This is called manually by the user (e.g., via backspace key)
        if (this.isFlippingGravity || this.gameOver) return;
        
        // Reset spawn counter
        this.spawnCount = 0;
        this.spawnsUntilFlip = this.generateSpawnsUntilFlip();
        
        // Trigger gravity flip
        await this.flipGravity();
    }

}

window.onload = () => {
    // Initialize game immediately - don't wait for splash screen
    const game = new RotrixGame();
    
    // Hacer el juego y el logger accesibles globalmente para debugging
    window.rotrixGame = game;
    window.rotrixLogger = game.logger;
    
    // Add tap handlers for canvas
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        let touchHandled = false;
        
        const canvasTapHandler = () => {
            if (game.showingQuitConfirmation) {
                // Resume from quit confirmation
                game.resumeFromQuitConfirmation();
            } else if (!game.gameOver && !game.paused && !game.isFlippingGravity) {
                // Rotate piece when tapping the board during gameplay
                game.rotatePiece();
            }
        };
        
        // Handle touch events (mobile)
        gameCanvas.addEventListener('touchstart', (e) => {
            touchHandled = true;
            canvasTapHandler();
            // Prevent click event from firing after touch
            e.preventDefault();
        }, { passive: false });
        
        // Handle click events (desktop)
        gameCanvas.addEventListener('click', (e) => {
            // Only handle click if touch wasn't already handled
            if (!touchHandled) {
                canvasTapHandler();
            }
            touchHandled = false; // Reset for next interaction
        });
    }
    
    // Hide splash screen after game is ready (only on native platforms)
    // Let it show for a bit, then hide it when game is ready
    if (window.isNative && window.SplashScreen) {
        // Wait a moment for splash to be visible, then hide it
        setTimeout(() => {
            if (window.SplashScreen) {
                window.SplashScreen.hide().catch(() => {
                    // Ignore errors - splash will auto-hide anyway
                });
            }
        }, 1500);
    }
    
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