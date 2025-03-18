class TetrisGame {
    constructor(width = 10, height = 20, blockSize = 30) {
        this.width = width;
        this.height = height;
        this.blockSize = blockSize;
        this.piecesPlaced = 0;
        this.switchInterval = 5; // Cambiar cada 10 piezas
        this.gravity = 1; // 1 para caer, -1 para subir
        this.dropSpeed = 200; // Velocidad de caída en milisegundos (500 = medio segundo)
        
        // Inicializar canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.width * this.blockSize;
        this.canvas.height = this.height * this.blockSize;
        
        // Inicializar tablero
        this.board = Array(height).fill().map(() => Array(width).fill(0));
        
        // Colores de las piezas
        this.colors = [
            null,
            '#FF0D72', // I
            '#0DC2FF', // J
            '#0DFF72', // L
            '#F538FF', // O
            '#FF8E0D', // S
            '#FFE138', // T
            '#3877FF'  // Z
        ];

        // Definir piezas
        this.pieces = [
            [[1, 1, 1, 1]], // I
            [[2, 0, 0], [2, 2, 2]], // J
            [[0, 0, 3], [3, 3, 3]], // L
            [[4, 4], [4, 4]], // O
            [[0, 5, 5], [5, 5, 0]], // S
            [[0, 6, 0], [6, 6, 6]], // T
            [[7, 7, 0], [0, 7, 7]]  // Z
        ];

        this.currentPiece = null;
        this.currentPiecePos = { x: 0, y: 0 };
        this.isInvertedMode = false;
        this.gameOver = false;
        
        this.init();
    }

    init() {
        this.spawnPiece();
        this.bindControls();
        this.gameLoop();
    }

    spawnPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.currentPiece = this.pieces[pieceIndex];
        
        if (this.isInvertedMode) {
            // Spawn desde abajo
            this.currentPiecePos = {
                x: Math.floor(this.width / 2) - Math.floor(this.currentPiece[0].length / 2),
                y: this.height - this.currentPiece.length
            };
        } else {
            // Spawn desde arriba
            this.currentPiecePos = {
                x: Math.floor(this.width / 2) - Math.floor(this.currentPiece[0].length / 2),
                y: 0
            };
        }

        // Verificar si la nueva pieza colisiona inmediatamente
        if (this.collision()) {
            this.endGame();
            return false;
        }
        return true;
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                if (e.keyCode === 13) { // ENTER
                    this.reset();
                }
                return;
            }

            switch(e.keyCode) {
                case 37: // Izquierda
                    this.movePiece(-1, 0);
                    break;
                case 39: // Derecha
                    this.movePiece(1, 0);
                    break;
                case 40: // Abajo/Arriba (dependiendo del modo)
                    this.movePiece(0, this.gravity);
                    break;
                case 38: // Rotar
                    this.rotatePiece();
                    break;
            }
        });
    }

    movePiece(dx, dy) {
        if (this.gameOver) return;

        this.currentPiecePos.x += dx;
        this.currentPiecePos.y += dy;
        
        if (this.collision()) {
            this.currentPiecePos.x -= dx;
            this.currentPiecePos.y -= dy;
            
            if (dy === this.gravity) {
                this.mergePiece();
                this.checkLines();
                this.piecesPlaced++;
                
                if (this.piecesPlaced % this.switchInterval === 0) {
                    this.switchGravity();
                }
                
                if (!this.gameOver) {
                    this.spawnPiece();
                }
            }
        }
    }

    switchGravity() {
        this.isInvertedMode = !this.isInvertedMode;
        this.gravity = this.isInvertedMode ? -1 : 1;
        
        if (this.isInvertedMode) {
            // Encontrar la pieza más alta
            let highestPiece = this.height;
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (this.board[y][x] !== 0) {
                        highestPiece = y;
                        break;
                    }
                }
                if (highestPiece !== this.height) break;
            }
            
            // Calcular cuánto hay que mover las piezas hacia arriba
            const shiftAmount = highestPiece;
            
            // Crear nuevo tablero vacío
            const newBoard = Array(this.height).fill().map(() => Array(this.width).fill(0));
            
            // Mover todas las piezas hacia arriba
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (this.board[y][x] !== 0) {
                        const newY = y - shiftAmount;
                        if (newY >= 0) {
                            newBoard[newY][x] = this.board[y][x];
                        }
                    }
                }
            }
            this.board = newBoard;
            // Ajustar la posición de la pieza actual
            if (this.currentPiece) {
                this.currentPiecePos.y = this.height - this.currentPiece.length;
            }
        } else {
            // Encontrar la pieza más baja
            let lowestPiece = -1;
            for (let y = this.height - 1; y >= 0; y--) {
                for (let x = 0; x < this.width; x++) {
                    if (this.board[y][x] !== 0) {
                        lowestPiece = y;
                        break;
                    }
                }
                if (lowestPiece !== -1) break;
            }
            
            // Calcular cuánto hay que mover las piezas hacia abajo
            const shiftAmount = (this.height - 1) - lowestPiece;
            
            // Crear nuevo tablero vacío
            const newBoard = Array(this.height).fill().map(() => Array(this.width).fill(0));
            
            // Mover todas las piezas hacia abajo
            for (let y = this.height - 1; y >= 0; y--) {
                for (let x = 0; x < this.width; x++) {
                    if (this.board[y][x] !== 0) {
                        const newY = y + shiftAmount;
                        if (newY < this.height) {
                            newBoard[newY][x] = this.board[y][x];
                        }
                    }
                }
            }
            this.board = newBoard;
            // Ajustar la posición de la pieza actual
            if (this.currentPiece) {
                this.currentPiecePos.y = 0;
            }
        }

        // Generar nueva pieza si no hay una activa
        if (!this.currentPiece) {
            this.spawnPiece();
        }
    }

    collision() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x] !== 0) {
                    const boardX = this.currentPiecePos.x + x;
                    const boardY = this.currentPiecePos.y + y;
                    
                    if (boardX < 0 || boardX >= this.width) {
                        return true;
                    }
                    
                    if (this.isInvertedMode) {
                        if (boardY < 0 || (boardY < this.height && this.board[boardY][boardX])) {
                            return true;
                        }
                    } else {
                        if (boardY >= this.height || (boardY >= 0 && this.board[boardY][boardX])) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    rotatePiece() {
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[row.length - 1 - i])
        );
        
        const originalPiece = this.currentPiece;
        this.currentPiece = rotated;
        
        if (this.collision()) {
            this.currentPiece = originalPiece;
        }
    }

    mergePiece() {
        if (this.gameOver) return;

        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x] !== 0) {
                    const boardY = this.currentPiecePos.y + y;
                    if (boardY >= 0 && boardY < this.height) {
                        this.board[boardY][this.currentPiecePos.x + x] = this.currentPiece[y][x];
                    }
                }
            }
        }

        // Verificar game over después de colocar la pieza
        if (this.checkGameOver()) {
            this.endGame();
        }
    }

    checkLines() {
        let linesCleared = 0;
        
        if (!this.isInvertedMode) {
            // Modo normal - las piezas caen
            for (let y = this.height - 1; y >= 0; y--) {
                if (this.board[y].every(cell => cell !== 0)) {
                    // Remover la línea completa
                    this.board.splice(y, 1);
                    // Agregar nueva línea vacía arriba
                    this.board.unshift(Array(this.width).fill(0));
                    // Incrementar contador y ajustar y para revisar la misma posición nuevamente
                    linesCleared++;
                    y++;
                }
            }
        } else {
            // Modo invertido - las piezas suben
            for (let y = 0; y < this.height; y++) {
                if (this.board[y].every(cell => cell !== 0)) {
                    // Remover la línea completa
                    this.board.splice(y, 1);
                    // Agregar nueva línea vacía abajo
                    this.board.push(Array(this.width).fill(0));
                    // Decrementar y para revisar la misma posición nuevamente
                    linesCleared++;
                    y--;
                }
            }
        }
        
        return linesCleared;
    }

    draw() {
        // Limpiar canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar tablero
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.colors[this.board[y][x]];
                    this.ctx.fillRect(x * this.blockSize, y * this.blockSize, 
                                    this.blockSize - 1, this.blockSize - 1);
                }
            }
        }
        
        // Dibujar pieza actual solo si el juego no ha terminado
        if (!this.gameOver && this.currentPiece) {
            for (let y = 0; y < this.currentPiece.length; y++) {
                for (let x = 0; x < this.currentPiece[y].length; x++) {
                    if (this.currentPiece[y][x]) {
                        this.ctx.fillStyle = this.colors[this.currentPiece[y][x]];
                        this.ctx.fillRect((this.currentPiecePos.x + x) * this.blockSize,
                                        (this.currentPiecePos.y + y) * this.blockSize,
                                        this.blockSize - 1, this.blockSize - 1);
                    }
                }
            }
        }

        // Si el juego terminó, dibujar el mensaje de game over
        if (this.gameOver) {
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

    checkGameOver() {
        if (!this.currentPiece) return false;
        
        if (this.isInvertedMode) {
            // En modo invertido, game over si:
            // 1. Hay piezas en la última fila
            return this.board[this.height - 1].some(cell => cell !== 0);
        } else {
            // En modo normal, game over si:
            // 1. Hay piezas en la primera fila
            return this.board[0].some(cell => cell !== 0);
        }
    }

    endGame() {
        this.gameOver = true;
        this.currentPiece = null; // Eliminar la pieza actual
        this.draw(); // Forzar un redibujado inmediato
    }

    reset() {
        this.board = Array(this.height).fill().map(() => Array(this.width).fill(0));
        this.piecesPlaced = 0;
        this.isInvertedMode = false;
        this.gravity = 1;
        this.gameOver = false;
        this.spawnPiece();
        this.draw();
        this.gameLoop();
    }

    gameLoop() {
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
        }
        
        this.movePiece(0, this.gravity);
        this.draw();
        if (!this.gameOver) {
            this.loopTimeout = setTimeout(() => this.gameLoop(), this.dropSpeed);
        }
    }
}

// Iniciar el juego
window.onload = () => {
    const game = new TetrisGame();
}; 