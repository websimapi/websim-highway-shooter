export default class Barrel {
    constructor(game, lane, yOffset = 0, speed = null) {
        this.game = game;
        this.width = Math.min(this.game.width * 0.2, 100);
        this.height = this.width;
        
        const laneWidth = this.game.width / 3;
        this.x = (lane * laneWidth) + (laneWidth / 2) - (this.width / 2);
        
        this.y = yOffset - this.height;
        this.speedY = speed !== null ? speed : Math.random() * 0.1 + 0.1;
        this.maxHealth = Math.floor(Math.random() * 5) + 1;
        this.health = this.maxHealth;
        this.active = true;
        
        this.image = new Image();
        this.image.src = 'barrel.png';
    }

    update(deltaTime) {
        this.y += this.speedY * deltaTime;
        if (this.y > this.game.height) {
            this.active = false;
        }
    }

    draw(context) {
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
        
        // Draw health number
        context.fillStyle = 'white';
        context.font = `${this.width * 0.5}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.health, this.x + this.width / 2, this.y + this.height / 2);
    }

    hit() {
        this.health--;
        if (this.health <= 0) {
            this.active = false;
        }
    }
}