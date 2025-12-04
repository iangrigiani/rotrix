import { GAME_CONFIG } from '../config/gameConfig.js';

export class Renderer {
    constructor(gameCanvas, nextPieceCanvas, blockSize) {
        this.canvas = gameCanvas;
        this.ctx = gameCanvas.getContext('2d');
        this.nextCanvas = nextPieceCanvas;
        this.nextCtx = nextPieceCanvas.getContext('2d');
        this.blockSize = blockSize;
        
        // Tamaño más pequeño para la próxima pieza
        this.nextBlockSize = 25;
        
        // Cache DOM elements to avoid repeated getElementById calls
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        
        // Performance optimization: cache frequently used values
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        this.centerX = this.canvasWidth / 2;
        this.centerY = this.canvasHeight / 2;
        
        // Optimization: pre-calculate block sizes
        this.blockSizeMinus1 = this.blockSize - 1;
        this.nextBlockSizeMinus1 = this.nextBlockSize - 1;
    }

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    // Optimized drawing with batched operations
    drawBoard(board, colors) {
        // Batch similar operations to reduce state changes
        const blocks = [];
        
        // Collect all blocks to draw
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                const cellValue = board.grid[y][x];
                if (cellValue) {
                    blocks.push({
                        x: x * this.blockSize,
                        y: y * this.blockSize,
                        color: colors[cellValue]
                    });
                }
            }
        }
        
        // Draw blocks grouped by color to minimize context switches
        const colorGroups = {};
        blocks.forEach(block => {
            if (!colorGroups[block.color]) {
                colorGroups[block.color] = [];
            }
            colorGroups[block.color].push(block);
        });
        
        // Render each color group
        Object.entries(colorGroups).forEach(([color, colorBlocks]) => {
            this.ctx.fillStyle = color;
            colorBlocks.forEach(block => {
                this.ctx.fillRect(block.x, block.y, this.blockSizeMinus1, this.blockSizeMinus1);
            });
        });
    }

    // Optimized piece drawing
    drawPiece(piece, colors) {
        const blocks = [];
        const pieceHeight = piece.current.length;
        
        // Collect all blocks to draw
        for (let y = 0; y < pieceHeight; y++) {
            const row = piece.current[y];
            const rowLength = row.length;
            
            for (let x = 0; x < rowLength; x++) {
                const cellValue = row[x];
                if (cellValue) {
                    blocks.push({
                        x: (piece.position.x + x) * this.blockSize,
                        y: (piece.position.y + y) * this.blockSize,
                        color: colors[cellValue]
                    });
                }
            }
        }
        
        // Batch draw by color
        const colorGroups = {};
        blocks.forEach(block => {
            if (!colorGroups[block.color]) {
                colorGroups[block.color] = [];
            }
            colorGroups[block.color].push(block);
        });
        
        Object.entries(colorGroups).forEach(([color, colorBlocks]) => {
            this.ctx.fillStyle = color;
            colorBlocks.forEach(block => {
                this.ctx.fillRect(block.x, block.y, this.blockSizeMinus1, this.blockSizeMinus1);
            });
        });
    }

    showLevelUp(level, drawCallback) {
        // Optimize by saving only necessary context state
        const originalComposite = this.ctx.globalCompositeOperation;
        
        // Use more efficient overlay method
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw text with cached center coordinates
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`¡NIVEL ${level}!`, this.centerX, this.centerY);
        
        // Restore only what was changed
        this.ctx.globalCompositeOperation = originalComposite;
        this.ctx.textAlign = 'start'; // Reset to default
        
        // Use requestAnimationFrame instead of setTimeout for better performance
        requestAnimationFrame(() => {
            setTimeout(() => drawCallback(), 1000);
        });
    }

    drawGameOver() {
        // Optimize overlay drawing
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Batch text drawing operations
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        
        // Draw all text at once to minimize context switches
        this.ctx.font = '30px Arial';
        this.ctx.fillText('¡GAME OVER!', this.centerX, this.centerY - 40);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Nivel alcanzado: ${this.levelDisplay.textContent}`, this.centerX, this.centerY);
        this.ctx.fillText(`Puntaje Final: ${this.scoreDisplay.textContent}`, this.centerX, this.centerY + 40);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Presiona ENTER para reiniciar', this.centerX, this.centerY + 60);
        
        // Reset text alignment
        this.ctx.textAlign = 'start';
    }

    drawPaused() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Paused text
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.font = '48px Arial';
        this.ctx.fillText('PAUSED', this.centerX, this.centerY);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press P to resume', this.centerX, this.centerY + 40);
        
        // Reset text alignment
        this.ctx.textAlign = 'start';
    }

    drawNextPiece(piece, colors) {
        // Early return if no next piece
        if (!piece.next) {
            this.nextCtx.fillStyle = '#000';
            this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
            return;
        }

        // Clear canvas
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        // Cache calculations
        const pieceWidth = piece.next[0].length;
        const pieceHeight = piece.next.length;
        const centerX = (this.nextCanvas.width - pieceWidth * this.nextBlockSize) / 2;
        const centerY = (this.nextCanvas.height - pieceHeight * this.nextBlockSize) / 2;

        // Batch drawing by color
        const blocks = [];
        for (let y = 0; y < pieceHeight; y++) {
            const row = piece.next[y];
            for (let x = 0; x < pieceWidth; x++) {
                const cellValue = row[x];
                if (cellValue) {
                    blocks.push({
                        x: centerX + x * this.nextBlockSize,
                        y: centerY + y * this.nextBlockSize,
                        color: colors[cellValue]
                    });
                }
            }
        }

        // Group by color and draw
        const colorGroups = {};
        blocks.forEach(block => {
            if (!colorGroups[block.color]) {
                colorGroups[block.color] = [];
            }
            colorGroups[block.color].push(block);
        });

        Object.entries(colorGroups).forEach(([color, colorBlocks]) => {
            this.nextCtx.fillStyle = color;
            colorBlocks.forEach(block => {
                this.nextCtx.fillRect(block.x, block.y, this.nextBlockSizeMinus1, this.nextBlockSizeMinus1);
            });
        });
    }

    // Optimized animation with fast cloning
    // boardState can be either a Board object or a pre-cloned grid array
    async animateLinesClear(lines, colors, boardState) {
        const duration = GAME_CONFIG.ANIMATIONS.LINE_CLEAR.BASE_DURATION * 
            Math.pow(GAME_CONFIG.ANIMATIONS.LINE_CLEAR.MULTIPLIER, lines.length - 1);
        
        // Support both Board objects and raw grid arrays
        const grid = Array.isArray(boardState) ? boardState : boardState.grid;
        const width = Array.isArray(boardState) ? boardState[0].length : boardState.width;
        
        // Pre-calculate positions for better performance
        const lineBlocks = [];
        lines.forEach(y => {
            for (let x = 0; x < width; x++) {
                lineBlocks.push({
                    x: x * this.blockSize,
                    y: y * this.blockSize,
                    originalColor: grid[y] && grid[y][x] ? colors[grid[y][x]] : null
                });
            }
        });
        
        // Optimized animation loop
        const flashColor = GAME_CONFIG.ANIMATIONS.LINE_CLEAR.FLASH_COLOR;
        const flashDuration = duration / 6;
        
        for (let flash = 0; flash < 3; flash++) {
            // Flash white
            this.ctx.fillStyle = flashColor;
            lineBlocks.forEach(block => {
                this.ctx.fillRect(block.x, block.y, this.blockSizeMinus1, this.blockSizeMinus1);
            });
            await new Promise(resolve => setTimeout(resolve, flashDuration));
            
            // Restore original colors
            lineBlocks.forEach(block => {
                if (block.originalColor) {
                    this.ctx.fillStyle = block.originalColor;
                    this.ctx.fillRect(block.x, block.y, this.blockSizeMinus1, this.blockSizeMinus1);
                }
            });
            await new Promise(resolve => setTimeout(resolve, flashDuration));
        }
    }


} 