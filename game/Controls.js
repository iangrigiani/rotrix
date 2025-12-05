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

            // Pause toggle (works even when paused)
            if (e.key === 'p' || e.key === 'P') {
                this.game.togglePause();
                return;
            }

            // Force gravity flip with backspace (works even when paused, but not during flip)
            if (e.key === 'Backspace') {
                if (!this.game.isFlippingGravity && !this.game.gameOver) {
                    e.preventDefault(); // Prevent browser back navigation
                    this.game.forceGravityFlip();
                }
                return;
            }

            // Don't process other keys when paused or flipping gravity
            if (this.game.paused || this.game.isFlippingGravity) {
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
                    // Move in gravity direction (down when gravity is down, up when gravity is up)
                    if (currentTime - this.lastMoveTime >= 25) {
                        const gravityDy = this.game.gravityDown ? 1 : -1;
                        this.game.movePiece(0, gravityDy);
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
                case ' ':
                    // Hard drop: piece falls until collision
                    e.preventDefault(); // Prevent page scroll
                    this.game.hardDrop();
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