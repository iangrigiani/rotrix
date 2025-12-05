export class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
        this.pieceIdGrid = this.createEmptyGrid(); // Track which piece each block belongs to
        this.nextPieceId = 1; // Unique ID for each piece placed
        this.lastClearedLines = [];
    }

    createEmptyGrid() {
        return Array.from({ length: this.height }, () => 
            Array.from({ length: this.width }, () => 0)
        );
    }

    reset() {
        this.grid = this.createEmptyGrid();
        this.pieceIdGrid = this.createEmptyGrid();
        this.nextPieceId = 1;
    }

    checkCollision(piece, pos, gravityDown = true) {
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
                    if (gravityDown) {
                        // Gravity down: allow y < 0 for pieces spawning above visible area
                        if (boardY >= this.height) {
                            return true;
                        }
                        if (boardY >= 0 && this.grid[boardY][boardX]) {
                            return true;
                        }
                    } else {
                        // Gravity up: allow y >= height for pieces spawning below visible area
                        if (boardY < 0) {
                            return true;
                        }
                        if (boardY < this.height && this.grid[boardY][boardX]) {
                            return true;
                        }
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
        const pieceId = this.nextPieceId++;
        
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
                        this.pieceIdGrid[boardY][boardX] = pieceId; // Track piece ID
                    }
                }
            }
        }
    }

    checkLines(gravityDown = true) {
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
                
                // Create new grid - pieces fall in gravity direction
                const newGrid = Array.from({ length: this.height }, () => 
                    Array.from({ length: this.width }, () => 0)
                );
                const newPieceIdGrid = Array.from({ length: this.height }, () => 
                    Array.from({ length: this.width }, () => 0)
                );
                
                if (gravityDown) {
                    // Gravity down: pieces fall down
                    const sortedLinesToClear = [...linesToClear].sort((a, b) => b - a);
                    
                    // Process each row from bottom to top
                    for (let y = this.height - 1; y >= 0; y--) {
                        // Skip cleared lines - they become empty
                        if (linesToClear.includes(y)) {
                            continue;
                        }
                        
                        // Calculate how many lines below this one were cleared
                        const linesClearedBelow = sortedLinesToClear.filter(clearedY => clearedY > y).length;
                        
                        // New position: fall down by the number of cleared lines below
                        const newY = y + linesClearedBelow;
                        
                        // Copy the entire row to its new position
                        if (newY < this.height) {
                            for (let x = 0; x < this.width; x++) {
                                newGrid[newY][x] = this.grid[y][x];
                                newPieceIdGrid[newY][x] = this.pieceIdGrid[y][x];
                            }
                        }
                    }
                } else {
                    // Gravity up: pieces fall up
                    const sortedLinesToClear = [...linesToClear].sort((a, b) => a - b);
                    
                    // Process each row from top to bottom
                    for (let y = 0; y < this.height; y++) {
                        // Skip cleared lines - they become empty
                        if (linesToClear.includes(y)) {
                            continue;
                        }
                        
                        // Calculate how many lines above this one were cleared
                        const linesClearedAbove = sortedLinesToClear.filter(clearedY => clearedY < y).length;
                        
                        // New position: fall up by the number of cleared lines above
                        const newY = y - linesClearedAbove;
                        
                        // Copy the entire row to its new position
                        if (newY >= 0) {
                            for (let x = 0; x < this.width; x++) {
                                newGrid[newY][x] = this.grid[y][x];
                                newPieceIdGrid[newY][x] = this.pieceIdGrid[y][x];
                            }
                        }
                    }
                }
                
                // Replace grids with the new ones
                this.grid = newGrid;
                this.pieceIdGrid = newPieceIdGrid;
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
    
    // Note: fastClone only clones grid, not pieceIdGrid
    // This is fine for line clearing animation which only needs colors

    // Identify rigid bodies - ALL blocks with the same piece ID form one rigid body
    // This ensures pieces maintain their shape even if blocks are disconnected
    identifyRigidBodies() {
        const bodies = [];
        const bodyId = Array.from({ length: this.height }, () => 
            Array.from({ length: this.width }, () => -1)
        );
        
        // Map piece IDs to bodies
        const pieceIdToBody = new Map();
        let currentBodyId = 0;
        
        // First pass: collect all blocks by piece ID
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const pieceId = this.pieceIdGrid[y][x];
                if (pieceId === 0 || this.grid[y][x] === 0) continue;
                
                if (!pieceIdToBody.has(pieceId)) {
                    // Create new body for this piece ID
                    const body = {
                        id: currentBodyId,
                        pieceId: pieceId,
                        blocks: [],
                        minY: y,
                        maxY: y,
                        minX: x,
                        maxX: x
                    };
                    bodies.push(body);
                    pieceIdToBody.set(pieceId, body);
                    currentBodyId++;
                }
                
                const body = pieceIdToBody.get(pieceId);
                body.blocks.push({ y, x, color: this.grid[y][x] });
                body.minY = Math.min(body.minY, y);
                body.maxY = Math.max(body.maxY, y);
                body.minX = Math.min(body.minX, x);
                body.maxX = Math.max(body.maxX, x);
                bodyId[y][x] = body.id;
            }
        }
        
        return { bodies, bodyId };
    }
    
    // Check if a rigid body can fall in the given direction
    canBodyFall(body, gravityDown, bodyId, otherBodies) {
        if (gravityDown) {
            // Check if any block in the body has a block below it
            for (const block of body.blocks) {
                const checkY = block.y + 1;
                if (checkY >= this.height) continue; // Can fall off bottom
                
                // Check if there's a block below that's not part of this body
                if (this.grid[checkY][block.x] !== 0 && bodyId[checkY][block.x] !== body.id) {
                    return false;
                }
            }
        } else {
            // Check if any block in the body has a block above it
            for (const block of body.blocks) {
                const checkY = block.y - 1;
                if (checkY < 0) continue; // Can fall off top
                
                // Check if there's a block above that's not part of this body
                if (this.grid[checkY][block.x] !== 0 && bodyId[checkY][block.x] !== body.id) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Calculate how far a body can fall
    // For each block, find the minimum fall distance considering all blocks in the body
    calculateFallDistance(body, gravityDown, bodyIdArray) {
        let maxFall = this.height;
        
        // For each column that has blocks from this body, calculate fall distance
        const columns = new Set();
        for (const block of body.blocks) {
            columns.add(block.x);
        }
        
        for (const col of columns) {
            // Get all blocks in this column for this body
            const columnBlocks = body.blocks.filter(b => b.x === col).sort((a, b) => 
                gravityDown ? a.y - b.y : b.y - a.y
            );
            
            if (columnBlocks.length === 0) continue;
            
            // Calculate fall distance for this column
            let columnFall = this.height;
            
            for (const block of columnBlocks) {
                let fall = 0;
                
                if (gravityDown) {
                    // Check how far down this block can fall
                    for (let y = block.y + 1; y < this.height; y++) {
                        // Can fall through empty cells or cells occupied by same body
                        if (this.grid[y][col] === 0 || bodyIdArray[y][col] === body.id) {
                            fall++;
                        } else {
                            // Hit another piece - stop here
                            break;
                        }
                    }
                } else {
                    // Check how far up this block can fall
                    for (let y = block.y - 1; y >= 0; y--) {
                        // Can fall through empty cells or cells occupied by same body
                        if (this.grid[y][col] === 0 || bodyIdArray[y][col] === body.id) {
                            fall++;
                        } else {
                            // Hit another piece - stop here
                            break;
                        }
                    }
                }
                
                // For this column, the fall distance is limited by the block that can fall the least
                columnFall = Math.min(columnFall, fall);
            }
            
            // Overall fall distance is limited by the column that can fall the least
            maxFall = Math.min(maxFall, columnFall);
        }
        
        return maxFall;
    }
    
    // Move a rigid body by a given offset
    moveBody(body, dy, bodyIdArray) {
        // Store original piece IDs before moving
        const pieceIds = body.blocks.map(b => this.pieceIdGrid[b.y][b.x]);
        
        // Remove body from grid
        for (const block of body.blocks) {
            this.grid[block.y][block.x] = 0;
            this.pieceIdGrid[block.y][block.x] = 0;
            bodyIdArray[block.y][block.x] = -1;
        }
        
        // Update block positions and place in new location
        for (let i = 0; i < body.blocks.length; i++) {
            const block = body.blocks[i];
            block.y += dy;
            this.grid[block.y][block.x] = block.color;
            this.pieceIdGrid[block.y][block.x] = pieceIds[i]; // Preserve piece ID
            bodyIdArray[block.y][block.x] = body.id;
        }
        
        // Update body bounds
        body.minY += dy;
        body.maxY += dy;
    }
    
    // Get all rigid bodies that need to fall, ordered by dependencies
    getFallingOrder(gravityDown) {
        const { bodies, bodyId } = this.identifyRigidBodies();
        
        if (bodies.length === 0) return [];
        
        // Build dependency graph
        const dependencies = new Map(); // bodyId -> Set of bodyIds that must fall first
        
        for (let i = 0; i < bodies.length; i++) {
            dependencies.set(i, new Set());
            
            for (let j = 0; j < bodies.length; j++) {
                if (i === j) continue;
                
                const bodyA = bodies[i];
                const bodyB = bodies[j];
                
                // Check if bodyB blocks bodyA
                let blocks = false;
                
                if (gravityDown) {
                    // BodyB blocks BodyA if any block of B is directly below any block of A
                    for (const blockA of bodyA.blocks) {
                        for (const blockB of bodyB.blocks) {
                            if (blockB.x === blockA.x && blockB.y === blockA.y + 1) {
                                blocks = true;
                                break;
                            }
                        }
                        if (blocks) break;
                    }
                } else {
                    // BodyB blocks BodyA if any block of B is directly above any block of A
                    for (const blockA of bodyA.blocks) {
                        for (const blockB of bodyB.blocks) {
                            if (blockB.x === blockA.x && blockB.y === blockA.y - 1) {
                                blocks = true;
                                break;
                            }
                        }
                        if (blocks) break;
                    }
                }
                
                if (blocks) {
                    dependencies.get(i).add(j);
                }
            }
        }
        
        // Topological sort to get falling order
        const order = [];
        const inDegree = new Map();
        const queue = [];
        
        // Calculate in-degrees
        for (let i = 0; i < bodies.length; i++) {
            inDegree.set(i, dependencies.get(i).size);
            if (inDegree.get(i) === 0) {
                queue.push(i);
            }
        }
        
        // Process queue
        while (queue.length > 0) {
            const current = queue.shift();
            order.push(current);
            
            // Reduce in-degree of dependent bodies
            for (let i = 0; i < bodies.length; i++) {
                if (dependencies.get(i).has(current)) {
                    inDegree.set(i, inDegree.get(i) - 1);
                    if (inDegree.get(i) === 0) {
                        queue.push(i);
                    }
                }
            }
        }
        
        return order.map(idx => ({
            body: bodies[idx],
            bodyId: idx
        }));
    }

    flipGravity(gravityDown) {
        // This method is now just a placeholder - actual gravity flip
        // is handled by animateRigidBodyGravityFlip in Renderer
        // The board will be updated during animation
    }

    // Visualize pieceId grid as a readable text format
    visualizePieceIdGrid() {
        let output = '';
        output += '='.repeat(this.width * 3 + 2) + '\n';
        output += 'PIECE ID GRID VISUALIZATION\n';
        output += `Board Size: ${this.width}x${this.height}\n`;
        output += '='.repeat(this.width * 3 + 2) + '\n\n';
        
        // Header with column numbers
        output += '   ';
        for (let x = 0; x < this.width; x++) {
            output += String(x).padStart(2, ' ') + ' ';
        }
        output += '\n';
        output += '  ' + '-'.repeat(this.width * 3) + '\n';
        
        // Grid rows with row numbers
        for (let y = 0; y < this.height; y++) {
            output += String(y).padStart(2, ' ') + '|';
            for (let x = 0; x < this.width; x++) {
                const pieceId = this.pieceIdGrid[y][x];
                const color = this.grid[y][x];
                if (pieceId === 0) {
                    output += ' . ';
                } else {
                    // Show piece ID, pad to 2 digits
                    output += String(pieceId).padStart(2, '0') + ' ';
                }
            }
            output += '|\n';
        }
        
        output += '  ' + '-'.repeat(this.width * 3) + '\n\n';
        
        // Legend: Show which piece IDs exist and their colors
        const pieceIdMap = new Map();
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const pieceId = this.pieceIdGrid[y][x];
                if (pieceId !== 0 && !pieceIdMap.has(pieceId)) {
                    pieceIdMap.set(pieceId, this.grid[y][x]);
                }
            }
        }
        
        if (pieceIdMap.size > 0) {
            output += 'PIECE ID LEGEND:\n';
            output += '-'.repeat(30) + '\n';
            for (const [pieceId, color] of Array.from(pieceIdMap.entries()).sort((a, b) => a[0] - b[0])) {
                output += `Piece ID ${String(pieceId).padStart(2, '0')}: Color ${color}\n`;
            }
            output += '\n';
        }
        
        return output;
    }

    // Export pieceId grid visualization to a file
    exportPieceIdGridToFile(filename) {
        try {
            const visualization = this.visualizePieceIdGrid();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fullFilename = `${filename}-${timestamp}.txt`;
            
            const blob = new Blob([visualization], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fullFilename;
            link.click();
            
            console.log(`PieceId grid exported: ${fullFilename}`);
            return fullFilename;
        } catch (e) {
            console.error('Error exporting pieceId grid:', e);
            return null;
        }
    }
} 