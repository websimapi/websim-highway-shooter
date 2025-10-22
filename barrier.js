export default class Barrier {
    constructor(game, lane) {
        this.game = game;
        this.lane = lane;

        const laneWidth = this.game.width / 3;
        this.width = laneWidth;
        this.height = this.width / 5; 
        
        const laneStartX = lane * laneWidth;
        this.x = laneStartX;
        
        this.y = -this.height; // Start off-screen
        this.speedY = Math.random() * 0.05 + 0.08;
        this.maxHealth = Math.floor(Math.random() * 10) + 1;
        this.health = this.maxHealth;
        this.active = true;
        this.rotation = 0;
        
        // Power-up logic
        this.hasPowerUp = Math.random() < 0.5; // 50% chance
        this.powerUpType = 'rapidFire';
        
        this.image = new Image();
        this.image.src = 'barrier.png';
    }

    update(deltaTime) {
        this.y += this.speedY * deltaTime;
        if (this.y > this.game.height) {
            this.active = false;
        }
    }

    draw(context) {
        if (!this.image.complete || this.image.naturalWidth === 0) return;
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
        
        context.fillStyle = 'white';
        context.font = `bold ${this.height * 0.7}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.strokeStyle = 'black';
        context.lineWidth = 4;

        const textX = this.x + this.width / 2;
        const textY = this.y + this.height / 2;
        
        context.strokeText(this.health, textX, textY);
        context.fillText(this.health, textX, textY);
    }

    hit() {
        this.health--;
        if (this.health <= 0) {
            this.active = false;
        }
    }
}