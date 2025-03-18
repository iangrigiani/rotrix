export class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array(this.height).fill().map(() => Array(this.width).fill(0));
    }

    reset() {
        this.grid = this.createEmptyGrid();
    }

    checkCollision(piece, pos, isInverted) {
        for (let y = 0; y < piece.current.length; y++) {
            for (let x = 0; x < piece.current[y].length; x++) {
                if (piece.current[y][x] !== 0) {
                    const boardX = pos.x + x;
                    const boardY = pos.y + y;
                    
                    if (boardX < 0 || boardX >= this.width) {
                        return true;
                    }
                    
                    if (isInverted) {
                        if (boardY < 0 || (boardY < this.height && this.grid[boardY][boardX])) {
                            return true;
                        }
                    } else {
                        if (boardY >= this.height || (boardY >= 0 && this.grid[boardY][boardX])) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    mergePiece(piece) {
        for (let y = 0; y < piece.current.length; y++) {
            for (let x = 0; x < piece.current[y].length; x++) {
                if (piece.current[y][x] !== 0) {
                    const boardY = piece.position.y + y;
                    if (boardY >= 0 && boardY < this.height) {
                        this.grid[boardY][piece.position.x + x] = piece.current[y][x];
                    }
                }
            }
        }
    }

    checkLines(isInverted) {
        let linesCleared = 0;
        
        if (!isInverted) {
            for (let y = this.height - 1; y >= 0; y--) {
                if (this.grid[y].every(cell => cell !== 0)) {
                    this.grid.splice(y, 1);
                    this.grid.unshift(Array(this.width).fill(0));
                    linesCleared++;
                    y++;
                }
            }
        } else {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[y].every(cell => cell !== 0)) {
                    this.grid.splice(y, 1);
                    this.grid.push(Array(this.width).fill(0));
                    linesCleared++;
                    y--;
                }
            }
        }
        
        return linesCleared;
    }
} 