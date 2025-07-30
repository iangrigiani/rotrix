export class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
        this.lastClearedLines = [];
    }

    createEmptyGrid() {
        return Array.from({ length: this.height }, () => 
            Array.from({ length: this.width }, () => 0)
        );
    }

    reset() {
        this.grid = this.createEmptyGrid();
    }

    checkCollision(piece, pos, isInverted) {
        const pieceHeight = piece.current.length;
        const pieceWidth = piece.current[0].length;
        
        for (let y = 0; y < pieceHeight; y++) {
            for (let x = 0; x < pieceWidth; x++) {
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
        const pieceHeight = piece.current.length;
        const pieceWidth = piece.current[0].length;
        
        // 🔧 DEBUG: Log detallado de merge
        console.log('=== MERGE PIECE DEBUG ===');
        console.log('Piece position:', piece.position);
        console.log('Piece matrix:');
        console.log(piece.current.map(row => row.map(c => c || '.').join('')).join('\n'));
        
        for (let y = 0; y < pieceHeight; y++) {
            for (let x = 0; x < pieceWidth; x++) {
                if (piece.current[y][x] !== 0) {
                    const boardY = piece.position.y + y;
                    const boardX = piece.position.x + x;
                    
                    console.log(`Writing ${piece.current[y][x]} to board[${boardY}][${boardX}]`);
                    
                    if (boardY >= 0 && boardY < this.height) {
                        this.grid[boardY][boardX] = piece.current[y][x];
                    }
                }
            }
        }
    }

    checkLines(isInverted) {
        this.lastClearedLines = [];
        let linesCleared = 0;
        
        // 🔧 DEBUG: Logging para encontrar bug
        console.log('=== CHECKING LINES ===');
        console.log('Board state BEFORE checking:');
        for (let y = 0; y < this.height; y++) {
            const row = this.grid[y];
            const rowStr = row.map(c => c || '.').join('');
            const isEmpty = row.every(cell => cell === 0);
            const isFull = row.every(cell => cell !== 0);
            console.log(`Row ${y}: "${rowStr}" (empty: ${isEmpty}, full: ${isFull})`);
        }
        
        // Identificar líneas completas
        for (let y = 0; y < this.height; y++) {
            if (this.grid[y].every(cell => cell !== 0)) {
                console.log(`🔴 DETECTED FULL LINE: ${y}`);
                this.lastClearedLines.push(y);
                linesCleared++;
            }
        }
        
        console.log(`Lines to clear: [${this.lastClearedLines.join(', ')}]`);
        
        // 🔧 FIX: Aplicar gravedad correctamente al eliminar líneas
        if (linesCleared > 0) {
            console.log('🔧 DEBUG: Aplicando eliminación de líneas + gravedad');
            
            // Crear nuevo grid donde aplicamos eliminación + gravedad en una sola operación
            const newGrid = Array.from({ length: this.height }, () => 
                Array.from({ length: this.width }, () => 0)
            );
            
            // 🔧 DEBUG: Procesar cada columna individualmente con logging detallado
            for (let x = 0; x < this.width; x++) {
                console.log(`\n--- PROCESANDO COLUMNA ${x} ---`);
                
                // Recolectar piezas que NO están en líneas a eliminar
                const column = [];
                console.log('Estado original de la columna:');
                for (let y = 0; y < this.height; y++) {
                    const value = this.grid[y][x];
                    const isInLineToRemove = this.lastClearedLines.includes(y);
                    console.log(`  Row ${y}: ${value || '.'} ${isInLineToRemove ? '(ELIMINAR)' : ''}`);
                    
                    if (value !== 0 && !isInLineToRemove) {
                        column.push(value);
                        console.log(`    → Agregado a columna: ${value}`);
                    }
                }
                
                console.log(`Piezas en columna después de eliminar líneas: [${column.join(', ')}]`);
                console.log(`Total piezas: ${column.length}`);
                
                // Aplicar gravedad según el modo
                console.log(`Aplicando gravedad (modo invertido: ${isInverted})...`);
                if (isInverted) {
                    // En modo invertido: piezas "caen" hacia arriba (y=0)
                    console.log('  Gravedad invertida: piezas van hacia arriba');
                    for (let i = 0; i < column.length; i++) {
                        const targetY = i;
                        newGrid[targetY][x] = column[i];
                        console.log(`    Pieza ${column[i]} colocada en fila ${targetY}`);
                    }
                } else {
                    // En modo normal: piezas caen hacia abajo
                    console.log('  Gravedad normal: piezas van hacia abajo');
                    for (let i = 0; i < column.length; i++) {
                        const targetY = this.height - column.length + i;
                        newGrid[targetY][x] = column[i];
                        console.log(`    Pieza ${column[i]} colocada en fila ${targetY}`);
                    }
                }
            }
            
            // Reemplazar grid con el nuevo (ya tiene gravedad aplicada)
            this.grid = newGrid;
            
            console.log('\n🔧 DEBUG: Grid DESPUÉS de eliminar líneas + aplicar gravedad:');
            for (let y = 0; y < this.height; y++) {
                const row = this.grid[y];
                const rowStr = row.map(c => c || '.').join('');
                const isEmpty = row.every(cell => cell === 0);
                const isFull = row.every(cell => cell !== 0);
                console.log(`Row ${y}: "${rowStr}" (empty: ${isEmpty}, full: ${isFull})`);
                
                // 🚨 VERIFICACIÓN CRÍTICA: ¿Se formó alguna línea completa nueva?
                if (isFull) {
                    console.error(`🚨 ERROR CRÍTICO: ¡Se formó una línea completa nueva en la fila ${y}!`);
                    console.error('    Esto NO debería pasar si la gravedad funciona correctamente.');
                    console.error('    Todas las piezas en cada columna se mueven la misma distancia.');
                }
            }
        }
        
        return linesCleared;
    }

    // Nueva función para aplicar gravedad a todo el tablero
    applyGravity(isInverted) {
        const newGrid = Array.from({ length: this.height }, () => 
            Array.from({ length: this.width }, () => 0)
        );
        
        if (isInverted) {
            // Gravedad invertida: las piezas van hacia arriba
            for (let x = 0; x < this.width; x++) {
                const column = [];
                for (let y = 0; y < this.height; y++) {
                    if (this.grid[y][x] !== 0) {
                        column.push(this.grid[y][x]);
                    }
                }
                // 🔧 FIX: En modo invertido, las piezas deben "caer" hacia arriba (y=0)
                for (let i = 0; i < column.length; i++) {
                    newGrid[i][x] = column[i];
                }
            }
        } else {
            // Gravedad normal: las piezas van hacia abajo
            for (let x = 0; x < this.width; x++) {
                const column = [];
                for (let y = 0; y < this.height; y++) {
                    if (this.grid[y][x] !== 0) {
                        column.push(this.grid[y][x]);
                    }
                }
                for (let i = 0; i < column.length; i++) {
                    newGrid[this.height - column.length + i][x] = column[i];
                }
            }
        }
        
        this.grid = newGrid;
    }

    getLastClearedLines() {
        return this.lastClearedLines;
    }

    fastClone() {
        return this.grid.map(row => [...row]);
    }
} 