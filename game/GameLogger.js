export class GameLogger {
    constructor() {
        this.logs = [];
        this.gameSession = this.generateSessionId();
        this.logToConsole = true; // Para debugging en tiempo real
        this.pieceCounter = 0;
        
        this.log('GAME_START', {
            sessionId: this.gameSession,
            timestamp: new Date().toISOString()
        });
    }

    generateSessionId() {
        return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    log(eventType, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            gameTime: performance.now(),
            eventType,
            ...data
        };

        this.logs.push(logEntry);

        if (this.logToConsole) {
            console.log(`[${eventType}]`, logEntry);
        }

        // Auto-save cada 10 logs para no perder información
        if (this.logs.length % 10 === 0) {
            this.saveToLocalStorage();
        }
    }

    logPieceSpawn(piece, position) {
        this.pieceCounter++;
        this.log('PIECE_SPAWN', {
            pieceNumber: this.pieceCounter,
            pieceType: this.getPieceTypeName(piece),
            position: { ...position },
            pieceMatrix: this.matrixToString(piece.current),
            nextPiece: piece.next ? this.getPieceTypeName({ current: piece.next }) : null
        });
    }

    logPieceMove(piece, oldPosition, newPosition, moveType) {
        this.log('PIECE_MOVE', {
            pieceNumber: this.pieceCounter,
            pieceType: this.getPieceTypeName(piece),
            oldPosition: { ...oldPosition },
            newPosition: { ...newPosition },
            moveType, // 'LEFT', 'RIGHT', 'DOWN', 'ROTATE'
            pieceMatrix: this.matrixToString(piece.current)
        });
    }

    logPieceLanded(piece, finalPosition) {
        this.log('PIECE_LANDED', {
            pieceNumber: this.pieceCounter,
            pieceType: this.getPieceTypeName(piece),
            finalPosition: { ...finalPosition },
            pieceMatrix: this.matrixToString(piece.current)
        });
    }

    logLinesCleared(clearedLines, board) {
        // Support both Board objects and raw grid arrays
        const grid = Array.isArray(board) ? board : board.grid;
        this.log('LINES_CLEARED', {
            linesCleared: clearedLines.length,
            lineNumbers: [...clearedLines],
            boardBeforeGravity: this.boardToString(grid)
        });
    }

    logGameOver(finalScore, finalLevel, totalPieces) {
        this.log('GAME_OVER', {
            finalScore,
            finalLevel,
            totalPieces,
            gameSession: this.gameSession
        });
        this.saveToLocalStorage();
        this.exportToFile();
    }

    // Utilidades para formatear datos
    getPieceTypeName(piece) {
        if (!piece || !piece.current) return 'UNKNOWN';
        
        // Identificar tipo de pieza por su forma
        const matrix = piece.current;
        const signature = this.matrixToString(matrix);
        
        const pieceTypes = {
            '1111': 'I_HORIZONTAL',
            '1\n1\n1\n1': 'I_VERTICAL', 
            '2  \n222': 'J',
            '  3\n333': 'L',
            '44\n44': 'O',
            ' 55\n55 ': 'S',
            ' 6 \n666': 'T',
            '77 \n 77': 'Z'
        };

        return pieceTypes[signature] || `CUSTOM_${signature.replace(/\n/g, '|')}`;
    }

    matrixToString(matrix) {
        if (!matrix) return '';
        return matrix.map(row => 
            row.map(cell => cell || ' ').join('')
        ).join('\n');
    }

    boardToString(grid) {
        return grid.map((row, y) => 
            `${y.toString().padStart(2, '0')}: ${row.map(cell => cell || '.').join('')}`
        ).join('\n');
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem(`rotrix-log-${this.gameSession}`, JSON.stringify({
                sessionId: this.gameSession,
                logs: this.logs,
                savedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.warn('No se pudo guardar el log en localStorage:', e);
        }
    }

    exportToFile() {
        try {
            const logData = {
                gameSession: this.gameSession,
                totalEvents: this.logs.length,
                totalPieces: this.pieceCounter,
                exportedAt: new Date().toISOString(),
                logs: this.logs
            };

            const dataStr = JSON.stringify(logData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `rotrix-log-${this.gameSession}.json`;
            link.click();
            
            console.log(`Log exportado: rotrix-log-${this.gameSession}.json`);
        } catch (e) {
            console.error('Error al exportar log:', e);
        }
    }

    // Métodos para análisis en tiempo real
    getLastEvents(count = 10) {
        return this.logs.slice(-count);
    }

    getEventsByType(eventType) {
        return this.logs.filter(log => log.eventType === eventType);
    }

    printSummary() {
        console.log('=== RESUMEN DEL JUEGO ===');
        console.log(`Sesión: ${this.gameSession}`);
        console.log(`Total eventos: ${this.logs.length}`);
        console.log(`Total piezas: ${this.pieceCounter}`);
        console.log('Eventos por tipo:');
        
        const eventCounts = {};
        this.logs.forEach(log => {
            eventCounts[log.eventType] = (eventCounts[log.eventType] || 0) + 1;
        });
        
        Object.entries(eventCounts).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });
    }
} 