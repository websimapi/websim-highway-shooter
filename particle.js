export default class Particle {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 6 - 3; // -3 to 3
        this.speedY = Math.random() * 6 - 3; // -3 to 3
        this.gravity = 0.1;
        this.lifespan = Math.random() * 50 + 50; // frames/updates
        this.active = true;
        this.color = `rgba(100, 200, 255, ${Math.random() * 0.5 + 0.5})`;
    }

    update(deltaTime) {
        // Normalize physics to be consistent regardless of framerate
        const dtFactor = deltaTime / 16.67; // Assuming 60fps is the baseline

        this.speedY += this.gravity * dtFactor;
        this.x += this.speedX * dtFactor;
        this.y += this.speedY * dtFactor;
        this.lifespan--;
        
        if (this.lifespan <= 0) {
            this.active = false;
        }
    }

    draw(context) {
        context.fillStyle = this.color;
        context.globalAlpha = this.lifespan / 100; // Fade out
        context.fillRect(this.x, this.y, this.size, this.size);
        context.globalAlpha = 1.0; // Reset alpha
    }
}