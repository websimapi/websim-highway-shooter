export default class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type; // e.g., 'rapidFire'
        this.width = 40;
        this.height = 40;
        this.speedY = 0.1; // Slower than barrels
        this.active = true;
        this.rotation = 0; // for collision

        this.image = new Image();
        if (this.type === 'rapidFire') {
            this.image.src = 'rapid_fire.png';
        } else if (this.type === 'bomb') {
            this.image.src = 'bomb.png';
        }
        // Could add more types here with an else if or switch
    }

    update(deltaTime) {
        this.y += this.speedY * deltaTime;
        if (this.y > this.game.height) {
            this.active = false;
        }
    }

    draw(context) {
        if (this.image.complete) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}