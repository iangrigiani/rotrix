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
    }

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBoard(board, colors) {
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                if (board.grid[y][x]) {
                    this.ctx.fillStyle = colors[board.grid[y][x]];
                    this.ctx.fillRect(
                        x * this.blockSize, 
                        y * this.blockSize,
                        this.blockSize - 1, 
                        this.blockSize - 1
                    );
                }
            }
        }
    }

    drawPiece(piece, colors) {
        for (let y = 0; y < piece.current.length; y++) {
            for (let x = 0; x < piece.current[y].length; x++) {
                if (piece.current[y][x]) {
                    this.ctx.fillStyle = colors[piece.current[y][x]];
                    this.ctx.fillRect(
                        (piece.position.x + x) * this.blockSize,
                        (piece.position.y + y) * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                }
            }
        }
    }

    showLevelUp(level, drawCallback) {
        // Guardar el estado actual
        const originalAlpha = this.ctx.globalAlpha;
        const originalFont = this.ctx.font;
        const originalAlign = this.ctx.textAlign;
        
        // Configurar el efecto
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar el texto
        this.ctx.fillStyle = '#FFD700'; // Color dorado
        this.ctx.font = '36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`¡NIVEL ${level}!`, this.canvas.width / 2, this.canvas.height / 2);
        
        // Restaurar el estado
        this.ctx.globalAlpha = originalAlpha;
        this.ctx.font = originalFont;
        this.ctx.textAlign = originalAlign;
        
        // Desvanecer el efecto usando el callback
        setTimeout(() => drawCallback(), 1000);
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('¡GAME OVER!', this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Nivel alcanzado: ${document.getElementById('levelDisplay').textContent}`,
            this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Puntaje Final: ${document.getElementById('scoreDisplay').textContent}`, 
            this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Presiona ENTER para reiniciar', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }

    drawNextPiece(piece, colors) {
        // Limpiar el canvas de la próxima pieza
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!piece.next) return;

        // Calcular el centro del canvas
        const centerX = (this.nextCanvas.width - piece.next[0].length * this.nextBlockSize) / 2;
        const centerY = (this.nextCanvas.height - piece.next.length * this.nextBlockSize) / 2;

        // Dibujar la próxima pieza
        for (let y = 0; y < piece.next.length; y++) {
            for (let x = 0; x < piece.next[y].length; x++) {
                if (piece.next[y][x]) {
                    this.nextCtx.fillStyle = colors[piece.next[y][x]];
                    this.nextCtx.fillRect(
                        centerX + x * this.nextBlockSize,
                        centerY + y * this.nextBlockSize,
                        this.nextBlockSize - 1,
                        this.nextBlockSize - 1
                    );
                }
            }
        }
    }

    async animateLinesClear(lines, colors, board) {
        const duration = GAME_CONFIG.ANIMATIONS.LINE_CLEAR.BASE_DURATION * 
            Math.pow(GAME_CONFIG.ANIMATIONS.LINE_CLEAR.MULTIPLIER, lines.length - 1);
        
        // Guardar estado original
        const originalBoard = JSON.parse(JSON.stringify(board.grid));
        
        // Animar el destello de las líneas
        for (let flash = 0; flash < 3; flash++) {
            // Pintar líneas en blanco
            for (const y of lines) {
                for (let x = 0; x < board.width; x++) {
                    this.ctx.fillStyle = GAME_CONFIG.ANIMATIONS.LINE_CLEAR.FLASH_COLOR;
                    this.ctx.fillRect(
                        x * this.blockSize,
                        y * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                }
            }
            await new Promise(resolve => setTimeout(resolve, duration / 6));
            
            // Restaurar color original
            for (const y of lines) {
                for (let x = 0; x < board.width; x++) {
                    if (originalBoard[y][x]) {
                        this.ctx.fillStyle = colors[originalBoard[y][x]];
                        this.ctx.fillRect(
                            x * this.blockSize,
                            y * this.blockSize,
                            this.blockSize - 1,
                            this.blockSize - 1
                        );
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, duration / 6));
        }
    }

    async animateGravitySwitch(board, isInvertedMode, colors) {
        const steps = GAME_CONFIG.ANIMATIONS.GRAVITY_SWITCH.STEPS;
        const stepDuration = GAME_CONFIG.ANIMATIONS.GRAVITY_SWITCH.DURATION / steps;
        
        // Crear una copia del tablero para la animación
        const originalBoard = JSON.parse(JSON.stringify(board.grid));
        
        for (let step = 1; step <= steps; step++) {
            this.clear();
            
            // Calcular posición actual de cada bloque
            for (let y = 0; y < board.height; y++) {
                for (let x = 0; x < board.width; x++) {
                    if (originalBoard[y][x]) {
                        const progress = step / steps;
                        const targetY = isInvertedMode ? 0 : board.height - 1;
                        const totalMove = targetY - y;
                        const currentMove = totalMove * progress;
                        
                        const newY = Math.floor(y + currentMove);
                        if (newY >= 0 && newY < board.height) {
                            this.ctx.fillStyle = colors[originalBoard[y][x]];
                            this.ctx.fillRect(
                                x * this.blockSize,
                                newY * this.blockSize,
                                this.blockSize - 1,
                                this.blockSize - 1
                            );
                        }
                    }
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
    }
} 