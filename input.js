export default class InputHandler {
    constructor(game) {
        this.game = game;
        this.targetX = game.width / 2;

        this.isDragging = false;
        this.dragStartX = 0;
        this.playerStartX = 0;

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (e.key === 'a' || e.key === 'ArrowLeft' || e.key === 'A') {
                this.targetX -= 30;
            } else if (e.key === 'd' || e.key === 'ArrowRight' || e.key === 'D') {
                this.targetX += 30;
            }
             this.clampTargetX();
        });

        // Touch and Mouse controls
        const getEventX = (e) => e.touches ? e.touches[0].clientX : e.clientX;

        game.player.game.width // this is a bit weird.
        const canvas = document.getElementById('game-canvas');

        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = getEventX(e);
            this.playerStartX = this.game.player.x;
        });
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.dragStartX = getEventX(e);
            this.playerStartX = this.game.player.x;
        }, { passive: false });

        canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const currentX = getEventX(e);
                const dx = currentX - this.dragStartX;
                this.targetX = this.playerStartX + dx + this.game.player.width / 2;
                this.clampTargetX();
            }
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                const currentX = getEventX(e);
                const dx = currentX - this.dragStartX;
                this.targetX = this.playerStartX + dx + this.game.player.width / 2;
                this.clampTargetX();
            }
        }, { passive: false });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        window.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    clampTargetX() {
        this.targetX = Math.max(this.game.player.width / 2, Math.min(this.game.width - this.game.player.width / 2, this.targetX));
    }
}