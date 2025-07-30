export class Controls {
    constructor(game) {
        this.game = game;
        this.lastMoveTime = 0;
        this.lastRotateTime = 0;
        this.moveThrottleMs = 50; // Prevent too frequent moves
        this.rotateThrottleMs = 150; // Prevent too frequent rotations
        this.pressedKeys = new Set(); // Track pressed keys to prevent key repeat spam
        this.bindKeys();
    }

    bindKeys() {
        // Optimized event handling with throttling
        document.addEventListener('keydown', (e) => {
            // Prevent handling if key is already pressed (key repeat)
            if (this.pressedKeys.has(e.key)) {
                return;
            }
            this.pressedKeys.add(e.key);
            
            if (this.game.gameOver) {
                if (e.key === 'Enter') {
                    this.game.reset();
                }
                return;
            }

            const currentTime = performance.now();

            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowRight':
                    // Throttle horizontal movement for better control
                    if (currentTime - this.lastMoveTime >= this.moveThrottleMs) {
                        const direction = e.key === 'ArrowLeft' ? -1 : 1;
                        this.game.movePiece(direction, 0);
                        this.lastMoveTime = currentTime;
                    }
                    break;
                case 'ArrowDown':
                    // Allow faster down movement
                    if (currentTime - this.lastMoveTime >= 25) {
                        this.game.movePiece(0, this.game.gravity);
                        this.lastMoveTime = currentTime;
                    }
                    break;
                case 'ArrowUp':
                    // Throttle rotation to prevent spam
                    if (currentTime - this.lastRotateTime >= this.rotateThrottleMs) {
                        this.game.rotatePiece();
                        this.lastRotateTime = currentTime;
                    }
                    break;
            }
        });

        // Clean up pressed keys on keyup
        document.addEventListener('keyup', (e) => {
            this.pressedKeys.delete(e.key);
        });

        // Clean up on window blur to prevent stuck keys
        window.addEventListener('blur', () => {
            this.pressedKeys.clear();
        });
    }
} 