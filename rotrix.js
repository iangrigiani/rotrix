import { Board } from './game/Board.js';
import { Piece } from './game/Piece.js';
import { Controls } from './game/Controls.js';
import { Renderer } from './game/Renderer.js';
import { GAME_CONFIG } from './config/gameConfig.js';

export class RotrixGame {
    constructor(
        width = GAME_CONFIG.DEFAULT_WIDTH, 
        height = GAME_CONFIG.DEFAULT_HEIGHT, 
        blockSize = GAME_CONFIG.DEFAULT_BLOCK_SIZE
    ) {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = width * blockSize;
        this.canvas.height = height * blockSize;

        this.board = new Board(width, height);
        this.piece = new Piece();
        this.renderer = new Renderer(this.canvas, blockSize);
        this.controls = new Controls(this);

        this.piecesPlaced = 0;
        this.nextGravitySwitch = this.calculateNextGravitySwitch();
        this.gravity = 1;
        this.dropSpeed = GAME_CONFIG.INITIAL_SPEED;
        this.isInvertedMode = false;
        this.gameOver = false;
        
        this.score = 0;
        this.level = 1;
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        
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
        this.piece.spawn(this.board.width);
        this.piece.position.y = this.isInvertedMode ? 
            this.board.height - this.piece.current.length : 0;

        if (this.board.checkCollision(this.piece, this.piece.position, this.isInvertedMode)) {
            this.endGame();
            return false;
        }
        return true;
    }

    movePiece(dx, dy) {
        if (this.gameOver) return;

        const newPos = {
            x: this.piece.position.x + dx,
            y: this.piece.position.y + dy
        };
        
        if (!this.board.checkCollision(this.piece, newPos, this.isInvertedMode)) {
            this.piece.position = newPos;
        } else if (dy === this.gravity) {
            this.board.mergePiece(this.piece);
            const linesCleared = this.board.checkLines(this.isInvertedMode);
            
            if (linesCleared > 0) {
                this.updateScore(GAME_CONFIG.LINE_POINTS[linesCleared] || 
                    GAME_CONFIG.LINE_POINTS[1] * linesCleared);
            }
            
            this.piecesPlaced++;
            
            if (this.piecesPlaced >= this.nextGravitySwitch) {
                this.switchGravity();
                this.piecesPlaced = 0;
                this.nextGravitySwitch = this.calculateNextGravitySwitch();
            }
            
            if (!this.gameOver) {
                this.spawnPiece();
            }
        }
    }

    rotatePiece() {
        const rotated = this.piece.rotate();
        const originalPiece = this.piece.current;
        this.piece.current = rotated;
        
        if (this.board.checkCollision(this.piece, this.piece.position, this.isInvertedMode)) {
            this.piece.current = originalPiece;
        }
    }

    switchGravity() {
        this.isInvertedMode = !this.isInvertedMode;
        this.gravity = this.isInvertedMode ? -1 : 1;
        
        if (this.isInvertedMode) {
            // Encontrar la pieza más alta
            let highestPiece = this.board.height;
            for (let y = 0; y < this.board.height; y++) {
                for (let x = 0; x < this.board.width; x++) {
                    if (this.board.grid[y][x] !== 0) {
                        highestPiece = y;
                        break;
                    }
                }
                if (highestPiece !== this.board.height) break;
            }
            
            // Calcular cuánto hay que mover las piezas hacia arriba
            const shiftAmount = highestPiece;
            
            // Crear nuevo tablero vacío
            const newBoard = Array(this.board.height).fill().map(() => Array(this.board.width).fill(0));
            
            // Mover todas las piezas hacia arriba
            for (let y = 0; y < this.board.height; y++) {
                for (let x = 0; x < this.board.width; x++) {
                    if (this.board.grid[y][x] !== 0) {
                        const newY = y - shiftAmount;
                        if (newY >= 0) {
                            newBoard[newY][x] = this.board.grid[y][x];
                        }
                    }
                }
            }
            this.board.grid = newBoard;
            // Ajustar la posición de la pieza actual
            if (this.piece.current) {
                this.piece.position.y = this.board.height - this.piece.current.length;
            }
        } else {
            // Encontrar la pieza más baja
            let lowestPiece = -1;
            for (let y = this.board.height - 1; y >= 0; y--) {
                for (let x = 0; x < this.board.width; x++) {
                    if (this.board.grid[y][x] !== 0) {
                        lowestPiece = y;
                        break;
                    }
                }
                if (lowestPiece !== -1) break;
            }
            
            // Calcular cuánto hay que mover las piezas hacia abajo
            const shiftAmount = (this.board.height - 1) - lowestPiece;
            
            // Crear nuevo tablero vacío
            const newBoard = Array(this.board.height).fill().map(() => Array(this.board.width).fill(0));
            
            // Mover todas las piezas hacia abajo
            for (let y = this.board.height - 1; y >= 0; y--) {
                for (let x = 0; x < this.board.width; x++) {
                    if (this.board.grid[y][x] !== 0) {
                        const newY = y + shiftAmount;
                        if (newY < this.board.height) {
                            newBoard[newY][x] = this.board.grid[y][x];
                        }
                    }
                }
            }
            this.board.grid = newBoard;
            // Ajustar la posición de la pieza actual
            if (this.piece.current) {
                this.piece.position.y = 0;
            }
        }

        // Generar nueva pieza si no hay una activa
        if (!this.piece.current) {
            this.spawnPiece();
        }
    }

    endGame() {
        this.gameOver = true;
        this.piece.current = null;
    }

    reset() {
        this.board.reset();
        this.piecesPlaced = 0;
        this.nextGravitySwitch = this.calculateNextGravitySwitch();
        this.isInvertedMode = false;
        this.gravity = 1;
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.dropSpeed = GAME_CONFIG.INITIAL_SPEED;
        this.updateScore(0);
        this.levelDisplay.textContent = this.level;
        this.spawnPiece();
        this.draw();
        this.gameLoop();
    }

    draw() {
        this.renderer.clear();
        this.renderer.drawBoard(this.board, Piece.COLORS);
        if (!this.gameOver && this.piece.current) {
            this.renderer.drawPiece(this.piece, Piece.COLORS);
        }
        if (this.gameOver) {
            this.renderer.drawGameOver();
        }
    }

    gameLoop() {
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
        }
        
        this.movePiece(0, this.gravity);
        this.updateScore(GAME_CONFIG.TICK_POINTS); // Puntos por tick
        this.draw();
        
        if (!this.gameOver) {
            this.loopTimeout = setTimeout(() => this.gameLoop(), this.dropSpeed);
        }
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
}; 