import { Board } from './game/Board.js';
import { Piece } from './game/Piece.js';
import { Controls } from './game/Controls.js';
import { Renderer } from './game/Renderer.js';
import { GameLogger } from './game/GameLogger.js';
import { HighscoreManager } from './game/HighscoreManager.js';
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
        
        // Touch drag system for horizontal and vertical movement
        this.touchStartX = null;
        this.touchStartY = null;
        this.touchLastX = null;
        this.touchLastY = null;
        this.touchStartTime = null;
        this.isDragging = false;
        this.dragVelocity = 0;
        this.dragVelocityY = 0;
        this.inertiaActive = false;
        this.inertiaVelocity = 0;
        this.dragStartPieceX = null; // Store piece X position when drag starts
        
        // Gravity flipping system
        this.gravityDown = true; // true = pieces fall down, false = pieces fall up
        this.spawnCount = 0;
        this.spawnsUntilFlip = this.generateSpawnsUntilFlip();
        this.isFlippingGravity = false; // Flag to prevent actions during flip animation
        this.isAnimatingLines = false; // Flag to prevent drawing during line clear animation
        
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
        // Don't start game loop automatically - wait for Play button
        this.gameStarted = false;
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
                
                // Set flag to prevent drawing during animation
                this.isAnimatingLines = true;
                
                // Pass the pre-clear board state for correct animation
                await this.renderer.animateLinesClear(
                    this.board.getLastClearedLines(), 
                    Piece.COLORS,
                    boardBeforeClear
                );
                
                // Clear flag after animation completes
                this.isAnimatingLines = false;
                
                this.updateScore(GAME_CONFIG.LINE_POINTS[linesCleared] || 
                    GAME_CONFIG.LINE_POINTS[1] * linesCleared);
                this.updateLines(linesCleared);
                
                // Redraw board after animation
                this.draw();
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

        // Restore piece to original horizontal position when drag started (if available)
        if (this.dragStartPieceX !== null) {
            const targetX = this.dragStartPieceX;
            const currentX = this.piece.position.x;
            if (currentX !== targetX) {
                // Move piece horizontally to original position
                const dx = targetX - currentX;
                const testPos = { ...this.piece.position, x: targetX };
                if (!this.board.checkCollision(this.piece, testPos, this.gravityDown)) {
                    this.piece.position.x = targetX;
                }
            }
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
            const fallDistance = Math.abs(currentPos.y - oldPos.y);
            
            // Award points for the distance dropped (same as if it fell naturally)
            this.updateScore(GAME_CONFIG.TICK_POINTS * fallDistance);
            
            this.piece.position = currentPos;
            this.logger.logPieceMove(this.piece, oldPos, currentPos, 'HARD_DROP');
            
            // Trigger landing logic by calling movePiece in gravity direction
            await this.movePiece(0, gravityDy);
        }
    }


    endGame() {
        // FIRST: Pause the game immediately
        this.paused = true;
        this.gameOver = true;
        this.piece.current = null;
        
        // Haptic feedback for game over
        if (window.HapticService) {
            window.HapticService.gameOver().catch(() => {});
        }
        
        // Stop animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // THEN: Check if score qualifies for highscore (top 5)
        console.log('[Game] Game over. Score:', this.score, 'Level:', this.level, 'Lines:', this.totalLines);
        const qualifies = HighscoreManager.qualifiesForHighscore(this.score);
        console.log('[Game] Score qualifies for highscore:', qualifies);
        
        if (qualifies) {
            // Show name input dialog (game is already paused)
            console.log('[Game] Showing name input dialog');
            this.showNameInputDialog();
        } else {
            console.log('[Game] Score does not qualify for highscore');
        }
        
        //this.logger.logGameOver(this.score, this.level, this.logger.pieceCounter);
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
        this.touchStartX = null;
        this.touchStartY = null;
        this.touchLastX = null;
        this.touchLastY = null;
        this.touchStartTime = null;
        this.isDragging = false;
        this.dragVelocity = 0;
        this.dragVelocityY = 0;
        this.inertiaActive = false;
        this.inertiaVelocity = 0;
        this.dragStartPieceX = null;
        this.gravityDown = true;
        this.spawnCount = 0;
        this.spawnsUntilFlip = this.generateSpawnsUntilFlip();
        this.isFlippingGravity = false;
        this.isAnimatingLines = false;
        this.updateScore(0);
        this.updateLines(0);
        this.levelDisplay.textContent = this.level;
        this.spawnPiece();
        this.draw();
        // Only start game loop if game was already started
        if (this.gameStarted) {
            this.gameLoop();
        }
    }

    draw() {
        // Don't draw during line clear animation (animation handles its own drawing)
        if (this.isAnimatingLines) {
            return;
        }
        
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

    start() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.gameLoop();
        }
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameOver || !this.gameStarted) return;
        
        // Skip game updates when paused or flipping gravity, but continue drawing
        if (!this.paused && !this.isFlippingGravity) {
            // Handle inertia movement
            if (this.inertiaActive && Math.abs(this.inertiaVelocity) > 0.05) {
                const blockSize = this.blockSize;
                const moveThreshold = blockSize * 0.3;
                const accumulatedMovement = Math.abs(this.inertiaVelocity * 16); // ~16ms per frame
                
                if (accumulatedMovement >= moveThreshold) {
                    const direction = this.inertiaVelocity > 0 ? 1 : -1;
                    this.movePiece(direction, 0);
                }
                
                // Apply friction to slow down inertia
                this.inertiaVelocity *= 0.92; // Decay factor
            } else {
                this.inertiaActive = false;
                this.inertiaVelocity = 0;
            }
            
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
        // Don't allow unpausing if game is over or if name input dialog is showing
        if (this.gameOver) return;
        
        // Check if name input dialog is visible
        const nameInputDialog = document.getElementById('nameInputDialog');
        if (nameInputDialog && !nameInputDialog.classList.contains('hidden')) {
            // Don't allow unpausing while name input dialog is shown
            return;
        }
        
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
    
    showNameInputDialog() {
        // Ensure game is paused when showing dialog
        if (!this.paused) {
            this.paused = true;
        }
        
        // Show name input dialog for highscore
        if (window.showNameInputDialog) {
            window.showNameInputDialog(this.score, this.level);
        }
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
        // Pass a callback to award points for pieces that fall
        await this.renderer.animateGravityFlip(
            this.board, 
            Piece.COLORS, 
            oldGravityDown,
            (fallDistance) => {
                // Award points for distance fallen (same as if pieces fell naturally)
                this.updateScore(GAME_CONFIG.TICK_POINTS * fallDistance);
            }
        );
        
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
            
            // Set flag to prevent drawing during animation
            this.isAnimatingLines = true;
            
            // Animate line clearing
            await this.renderer.animateLinesClear(
                this.board.getLastClearedLines(), 
                Piece.COLORS,
                boardBeforeClear
            );
            
            // Clear flag after animation completes
            this.isAnimatingLines = false;
            
            this.updateScore(GAME_CONFIG.LINE_POINTS[linesCleared] || 
                GAME_CONFIG.LINE_POINTS[1] * linesCleared);
            this.updateLines(linesCleared);
            
            // Redraw board after animation
            this.draw();
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
    
    // Add touch/click handlers for canvas
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        let touchHandled = false;
        let touchStartTime = 0;
        let touchStartX = 0;
        let touchStartY = 0;
        let lastTouchX = 0;
        let lastTouchTime = 0;
        let hasMoved = false;
        const TAP_THRESHOLD = 10; // pixels - if moved less than this, consider it a tap
        const TAP_TIME_THRESHOLD = 200; // ms - if released within this time, consider it a tap
        
        // Handle touch start
        gameCanvas.addEventListener('touchstart', (e) => {
            touchHandled = true;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            lastTouchX = touchStartX;
            touchStartTime = Date.now();
            lastTouchTime = touchStartTime;
            hasMoved = false;
            
            if (game.showingQuitConfirmation) {
                // Resume from quit confirmation
                game.resumeFromQuitConfirmation();
                e.preventDefault();
                return;
            }
            
            if (game.gameOver) {
                // Don't restart on touchstart - wait for touchend to confirm it's a tap
                e.preventDefault();
                return;
            }
            
            if (!game.paused && !game.isFlippingGravity) {
                // Start drag tracking
                game.touchStartX = touchStartX;
                game.touchStartY = touchStartY;
                game.touchLastX = touchStartX;
                game.touchLastY = touchStartY;
                game.touchStartTime = touchStartTime;
                game.isDragging = true;
                game.inertiaActive = false;
                game.dragVelocityY = 0;
                // Store piece's horizontal position when drag starts
                if (game.piece && game.piece.current) {
                    game.dragStartPieceX = game.piece.position.x;
                }
                e.preventDefault();
            }
        }, { passive: false });
        
        // Handle touch move
        gameCanvas.addEventListener('touchmove', (e) => {
            if (game.showingQuitConfirmation || game.gameOver || game.paused || game.isFlippingGravity) {
                return;
            }
            
            if (!game.isDragging) {
                return;
            }
            
            const touch = e.touches[0];
            const currentX = touch.clientX;
            const currentY = touch.clientY;
            const currentTime = Date.now();
            
            // Check if finger has moved significantly
            const deltaX = Math.abs(currentX - touchStartX);
            const deltaY = Math.abs(currentY - touchStartY);
            
            if (deltaX > TAP_THRESHOLD || deltaY > TAP_THRESHOLD) {
                hasMoved = true;
            }
            
            // Process horizontal movement
            if (deltaX > 0) {
                const horizontalDelta = currentX - game.touchLastX;
                const blockSize = game.blockSize;
                
                // Move piece based on horizontal delta (in blocks)
                if (Math.abs(horizontalDelta) >= blockSize * 0.3) {
                    const direction = horizontalDelta > 0 ? 1 : -1;
                    game.movePiece(direction, 0);
                    game.touchLastX = currentX;
                }
                
                // Calculate horizontal velocity for inertia
                const timeDelta = currentTime - lastTouchTime;
                if (timeDelta > 0) {
                    const velocity = (currentX - lastTouchX) / timeDelta; // pixels per ms
                    game.dragVelocity = velocity;
                }
                
                lastTouchX = currentX;
            }
            
            // Process vertical movement
            if (deltaY > 0) {
                const verticalDelta = currentY - (game.touchLastY || touchStartY);
                const timeDelta = currentTime - lastTouchTime;
                
                // Calculate vertical velocity
                if (timeDelta > 0) {
                    const velocityY = verticalDelta / timeDelta;
                    game.dragVelocityY = velocityY;
                }
                
                game.touchLastY = currentY;
            }
            
            lastTouchTime = currentTime;
            
            e.preventDefault();
        }, { passive: false });
        
        // Handle touch end
        gameCanvas.addEventListener('touchend', (e) => {
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            
            if (game.showingQuitConfirmation) {
                touchHandled = false;
                return;
            }
            
            // If game over, restart on any tap
            if (game.gameOver) {
                game.reset();
                touchHandled = false;
                e.preventDefault();
                return;
            }
            
            if (game.isDragging) {
                game.isDragging = false;
                
                // Calculate vertical delta
                const verticalDelta = game.touchLastY - game.touchStartY;
                const HARD_DROP_THRESHOLD = game.blockSize * 3; // 3 blocks worth of movement
                
                // If it was a quick tap without movement, rotate piece
                if (!hasMoved && touchDuration < TAP_TIME_THRESHOLD) {
                    game.rotatePiece();
                } else {
                    // Check for hard drop (large vertical movement)
                    if (Math.abs(verticalDelta) >= HARD_DROP_THRESHOLD) {
                        // Check if movement is in gravity direction
                        const isDownward = verticalDelta > 0;
                        const matchesGravity = (game.gravityDown && isDownward) || (!game.gravityDown && !isDownward);
                        
                        if (matchesGravity) {
                            // Hard drop in gravity direction
                            game.hardDrop();
                        }
                    } else {
                        // Apply horizontal inertia if there was horizontal movement
                        if (hasMoved && Math.abs(game.dragVelocity) > 0.1) {
                            game.inertiaActive = true;
                            game.inertiaVelocity = game.dragVelocity * 0.5; // Scale down velocity
                        }
                        
                        // Apply vertical movement based on gravity direction
                        if (Math.abs(verticalDelta) > game.blockSize * 0.5) {
                            const isDownward = verticalDelta > 0;
                            const matchesGravity = (game.gravityDown && isDownward) || (!game.gravityDown && !isDownward);
                            
                            if (matchesGravity) {
                                // Move piece in gravity direction
                                const gravityDy = game.gravityDown ? 1 : -1;
                                game.movePiece(0, gravityDy);
                            }
                        }
                    }
                }
                
                game.touchStartX = null;
                game.touchStartY = null;
                game.touchLastX = null;
                game.touchLastY = null;
                game.touchStartTime = null;
                game.dragVelocityY = 0;
                game.dragStartPieceX = null;
            }
            
            touchHandled = false;
            e.preventDefault();
        }, { passive: false });
        
        // Handle click events (desktop)
        gameCanvas.addEventListener('click', (e) => {
            // Only handle click if touch wasn't already handled
            if (!touchHandled) {
                if (game.showingQuitConfirmation) {
                    game.resumeFromQuitConfirmation();
                } else if (game.gameOver) {
                    game.reset();
                } else if (!game.paused && !game.isFlippingGravity) {
                    game.rotatePiece();
                }
            }
            touchHandled = false;
        });
    }
    
    // Handle splash screen and show main menu
    function showMenuAfterSplash() {
        if (window.showMainMenu) {
            window.showMainMenu();
        } else {
            // Fallback if function not available yet
            const menu = document.getElementById('mainMenu');
            const game = document.getElementById('gameContainer');
            if (menu) menu.classList.remove('hidden');
            if (game) game.classList.add('hidden');
        }
    }
    
    // Hide splash screen after game is ready (only on native platforms)
    // Let it show for a bit, then hide it when game is ready
    if (window.isNative && window.SplashScreen) {
        // Wait a moment for splash to be visible, then hide it and show main menu
        setTimeout(() => {
            if (window.SplashScreen) {
                window.SplashScreen.hide().catch(() => {
                    // Ignore errors - splash will auto-hide anyway
                });
            }
            // Show main menu after splash is hidden
            showMenuAfterSplash();
        }, 2500); // Show splash for at least 2.5 seconds
    } else {
        // On web/non-native, show menu after a short delay
        setTimeout(showMenuAfterSplash, 500);
    }
    
    // Fallback: ensure menu shows even if splash screen logic fails
    setTimeout(() => {
        const menu = document.getElementById('mainMenu');
        if (menu && menu.classList.contains('hidden')) {
            showMenuAfterSplash();
        }
    }, 3500);
    
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