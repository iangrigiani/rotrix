export class Piece {
    static SHAPES = [
        [[1, 1, 1, 1]], // I
        [[2, 0, 0], [2, 2, 2]], // J
        [[0, 0, 3], [3, 3, 3]], // L
        [[4, 4], [4, 4]], // O
        [[0, 5, 5], [5, 5, 0]], // S
        [[0, 6, 0], [6, 6, 6]], // T
        [[7, 7, 0], [0, 7, 7]]  // Z
    ];

    static COLORS = [
        null,
        '#FF0D72', // I
        '#0DC2FF', // J
        '#0DFF72', // L
        '#F538FF', // O
        '#FF8E0D', // S
        '#FFE138', // T
        '#3877FF'  // Z
    ];

    // Pre-computed rotations for better performance (object pooling concept)
    static _rotationCache = new Map();

    constructor() {
        this.current = null;
        this.next = null;
        this.position = { x: 0, y: 0 };
        // Performance optimization: pre-allocate rotation matrix
        this._rotationMatrix = [];
    }

    generateNewPiece() {
        const pieceIndex = Math.floor(Math.random() * Piece.SHAPES.length);
        return Piece.SHAPES[pieceIndex];
    }

    spawn(width) {
        if (this.next === null) {
            this.next = this.generateNewPiece();
        }
        this.current = this.next;
        this.next = this.generateNewPiece();
        this.position.x = Math.floor(width / 2) - Math.floor(this.current[0].length / 2);
    }

    // Optimized rotation with caching
    rotate() {
        if (!this.current) return null;
        
        // Create a cache key for this piece shape
        const cacheKey = JSON.stringify(this.current);
        
        // Check if rotation is already cached
        if (Piece._rotationCache.has(cacheKey)) {
            return Piece._rotationCache.get(cacheKey);
        }
        
        // Perform rotation calculation
        const rows = this.current.length;
        const cols = this.current[0].length;
        
        // Pre-allocate result array for better performance
        const rotated = Array.from({ length: cols }, () => 
            Array.from({ length: rows }, () => 0)
        );
        
        // Optimized rotation algorithm
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = this.current[i][j];
            }
        }
        
        // Cache the result for future use
        Piece._rotationCache.set(cacheKey, rotated);
        
        // Limit cache size to prevent memory leaks
        if (Piece._rotationCache.size > 100) {
            const firstKey = Piece._rotationCache.keys().next().value;
            Piece._rotationCache.delete(firstKey);
        }
        
        return rotated;
    }

    // Performance utility: clear rotation cache when needed
    static clearRotationCache() {
        Piece._rotationCache.clear();
    }
} 