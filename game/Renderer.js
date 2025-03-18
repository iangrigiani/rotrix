export class Renderer {
    constructor(canvas, blockSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.blockSize = blockSize;
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

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('¡GAME OVER!', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Presiona ENTER para reiniciar', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
} 