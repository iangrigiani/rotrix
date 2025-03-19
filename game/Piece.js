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

    constructor() {
        this.current = null;
        this.next = null;
        this.position = { x: 0, y: 0 };
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

    rotate() {
        return this.current[0].map((_, i) =>
            this.current.map(row => row[row.length - 1 - i])
        );
    }
} 