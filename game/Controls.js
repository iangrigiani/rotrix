export class Controls {
    constructor(game) {
        this.game = game;
        this.bindKeys();
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (this.game.gameOver) {
                if (e.keyCode === 13) { // ENTER
                    this.game.reset();
                }
                return;
            }

            switch(e.keyCode) {
                case 37: // Izquierda
                    this.game.movePiece(-1, 0);
                    break;
                case 39: // Derecha
                    this.game.movePiece(1, 0);
                    break;
                case 40: // Abajo/Arriba (dependiendo del modo)
                    this.game.movePiece(0, this.game.gravity);
                    break;
                case 38: // Rotar
                    this.game.rotatePiece();
                    break;
            }
        });
    }
} 