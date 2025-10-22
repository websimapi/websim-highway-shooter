export default class InputHandler {
    constructor(game) {
        this.game = game;
        this.targetX = game.width / 2;

        this.isDragging = false;
        this.dragStartX = 0;
        this.playerStartX = 0;
        
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.tapThreshold = 10; // Max pixels moved to be considered a tap

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (e.key === 'a' || e.key === 'ArrowLeft' || e.key === 'A') {
                this.targetX -= 30;
            } else if (e.key === 'd' || e.key === 'ArrowRight' || e.key === 'D') {
                this.targetX += 30;
            } else if (e.key === ' ') { // Space bar
                e.preventDefault();
                this.game.player.useBomb();
            }
             this.clampTargetX();
        });

        // Touch and Mouse controls
        const getEventX = (e) => e.touches ? e.touches[0].clientX : e.clientX;
        const getEventY = (e) => e.touches ? e.touches[0].clientY : e.clientY;

        const canvas = document.getElementById('game-canvas');

        const handleDragStart = (e) => {
            this.isDragging = true;
            this.dragStartX = getEventX(e);
            this.touchStartX = getEventX(e);
            this.touchStartY = getEventY(e);
            this.playerStartX = this.game.player.x;
        };

        const handleDragMove = (e) => {
            if (this.isDragging) {
                const currentX = getEventX(e);
                const dx = currentX - this.dragStartX;
                this.targetX = this.playerStartX + dx + this.game.player.width / 2;
                this.clampTargetX();
            }
        };

        const handleDragEnd = (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;

            const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

            const dx = endX - this.touchStartX;
            const dy = endY - this.touchStartY;

            // If the finger/mouse moved less than the threshold, it's a tap/click
            if (Math.sqrt(dx * dx + dy * dy) < this.tapThreshold) {
                this.game.player.useBomb();
            }
        };

        canvas.addEventListener('mousedown', handleDragStart);
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDragStart(e);
        }, { passive: false });

        canvas.addEventListener('mousemove', handleDragMove);
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleDragMove(e);
        }, { passive: false });

        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchend', handleDragEnd);
    }

    clampTargetX() {
        this.targetX = Math.max(this.game.player.width / 2, Math.min(this.game.width - this.game.player.width / 2, this.targetX));
    }
}