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

    checkCollision(piece, pos) {
        // Safety check: ensure piece.current exists and is valid
        if (!piece.current || !Array.isArray(piece.current) || piece.current.length === 0) {
            return true; // Invalid piece = collision
        }
        
        if (!piece.current[0] || !Array.isArray(piece.current[0])) {
            return true; // Invalid piece structure = collision
        }
        
        const pieceHeight = piece.current.length;
        const pieceWidth = piece.current[0].length;
        
        for (let y = 0; y < pieceHeight; y++) {
            // Safety check: ensure row exists
            if (!piece.current[y] || !Array.isArray(piece.current[y])) {
                continue; // Skip invalid rows
            }
            
            for (let x = 0; x < pieceWidth; x++) {
                if (piece.current[y][x] !== 0) {
                    const boardX = pos.x + x;
                    const boardY = pos.y + y;
                    
                    // Check horizontal boundaries
                    if (boardX < 0 || boardX >= this.width) {
                        return true;
                    }
                    
                    // Check vertical boundaries and collisions
                    // Allow y < 0 for pieces spawning above visible area
                    if (boardY >= this.height) {
                        return true;
                    }
                    if (boardY >= 0 && this.grid[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    mergePiece(piece) {
        // Safety check: ensure piece.current exists and is valid
        if (!piece.current || !Array.isArray(piece.current) || piece.current.length === 0) {
            return; // Invalid piece, nothing to merge
        }
        
        if (!piece.current[0] || !Array.isArray(piece.current[0])) {
            return; // Invalid piece structure, nothing to merge
        }
        
        const pieceHeight = piece.current.length;
        const pieceWidth = piece.current[0].length;
        
        for (let y = 0; y < pieceHeight; y++) {
            // Safety check: ensure row exists
            if (!piece.current[y] || !Array.isArray(piece.current[y])) {
                continue; // Skip invalid rows
            }
            
            for (let x = 0; x < pieceWidth; x++) {
                if (piece.current[y][x] !== 0) {
                    const boardY = piece.position.y + y;
                    const boardX = piece.position.x + x;
                    
                    // Only merge blocks that are within board boundaries
                    if (boardY >= 0 && boardY < this.height && 
                        boardX >= 0 && boardX < this.width) {
                        this.grid[boardY][boardX] = piece.current[y][x];
                    }
                }
            }
        }
    }

    checkLines() {
        this.lastClearedLines = [];
        let totalLinesCleared = 0;
        
        // Recursive line clearing - keep checking until no more full lines
        let foundLines = true;
        while (foundLines) {
            foundLines = false;
            const linesToClear = [];
            
            // Identify complete lines
            for (let y = 0; y < this.height; y++) {
                const row = this.grid[y];
                if (!row || !Array.isArray(row)) {
                    console.warn(`[checkLines] Row ${y} is invalid:`, row);
                    continue;
                }
                
                // Safety check: ensure row has correct width
                if (row.length !== this.width) {
                    console.error(`[checkLines] Row ${y} has incorrect length: ${row.length} (expected ${this.width})`);
                    continue;
                }
                
                // Debug: Log row state for lines that might be problematic
                // Check for invalid cell values (non-numeric, null, undefined, etc.)
                const invalidCells = row.filter((cell, x) => {
                    const isValid = typeof cell === 'number' && !isNaN(cell);
                    if (!isValid && cell !== 0) {
                        console.warn(`[checkLines] Row ${y}, Col ${x} has invalid value:`, cell, typeof cell);
                    }
                    return !isValid;
                });
                
                if (invalidCells.length > 0) {
                    console.error(`[checkLines] Row ${y} has ${invalidCells.length} invalid cells`);
                    continue;
                }
                
                const filledCount = row.filter(cell => cell !== 0).length;
                const emptyCount = row.filter(cell => cell === 0).length;
                const rowString = row.map(c => c === 0 ? '.' : c).join('');
                
                // Check if line is complete - all cells must be non-zero
                const isFull = row.every(cell => cell !== 0);
                
                // Additional validation: double-check with explicit count
                const isActuallyFull = filledCount === this.width && emptyCount === 0;
                
                if (isFull || isActuallyFull) {
                    // If every() says it's full but counts don't match, there's a bug
                    if (isFull !== isActuallyFull) {
                        console.error(`[checkLines] INCONSISTENCY DETECTED at line ${y}:`);
                        console.error(`  every() says full: ${isFull}`);
                        console.error(`  Count check says full: ${isActuallyFull}`);
                        console.error(`  Filled: ${filledCount}/${this.width}, Empty: ${emptyCount}`);
                        console.error(`  Row: [${row.join(',')}]`);
                        console.error(`  Row string: "${rowString}"`);
                        // Don't clear if counts don't match - this is a bug
                        if (!isActuallyFull) {
                            continue;
                        }
                    }
                    
                    // Final safety check before clearing
                    if (filledCount !== this.width) {
                        console.error(`[checkLines] SAFETY CHECK FAILED: Line ${y} has ${filledCount}/${this.width} filled cells but was marked for clearing`);
                        console.error(`[checkLines] Row: "${rowString}"`);
                        continue; // Skip clearing this line
                    }
                    
                    linesToClear.push(y);
                    foundLines = true;
                }
            }
            
            if (linesToClear.length > 0) {
                // Debug logging (only in development)
                if (typeof window !== 'undefined' && window.DEBUG_ROTRIX) {
                    console.log(`[checkLines] Iteration detected ${linesToClear.length} full line(s):`, linesToClear);
                    linesToClear.forEach(lineNum => {
                        const row = this.grid[lineNum];
                        const rowString = row ? row.map(c => c === 0 ? '.' : c).join('') : 'INVALID';
                        console.log(`[checkLines]   Line ${lineNum}: "${rowString}"`);
                    });
                }
                
                // Add to the list of all cleared lines (for animation)
                this.lastClearedLines.push(...linesToClear);
                totalLinesCleared += linesToClear.length;
                
                // Create new grid - pieces fall down by exactly the number of cleared lines
                const newGrid = Array.from({ length: this.height }, () => 
                    Array.from({ length: this.width }, () => 0)
                );
                
                // Sort cleared lines to process from bottom to top
                const sortedLinesToClear = [...linesToClear].sort((a, b) => b - a);
                
                // Process each row from bottom to top
                for (let y = this.height - 1; y >= 0; y--) {
                    // Skip cleared lines - they become empty
                    if (linesToClear.includes(y)) {
                        continue;
                    }
                    
                    // Calculate how many lines below this one were cleared
                    // (lines with higher y values that are being cleared)
                    const linesClearedBelow = sortedLinesToClear.filter(clearedY => clearedY > y).length;
                    
                    // New position: fall down by the number of cleared lines below
                    const newY = y + linesClearedBelow;
                    
                    // Copy the entire row to its new position
                    if (newY < this.height) {
                        for (let x = 0; x < this.width; x++) {
                            newGrid[newY][x] = this.grid[y][x];
                        }
                    }
                }
                
                // Replace grid with the new one
                this.grid = newGrid;
            }
        }
        
        return totalLinesCleared;
    }

    getLastClearedLines() {
        return this.lastClearedLines;
    }

    fastClone() {
        return this.grid.map(row => [...row]);
    }
} 