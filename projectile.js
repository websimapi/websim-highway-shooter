export default class Projectile {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 20;
        this.speed = 0.8; // pixels per ms
        this.active = true;
        this.image = new Image();
        this.image.src = 'projectile.png';
    }

    update(deltaTime) {
        this.y -= this.speed * deltaTime;
        if (this.y < -this.height) {
            this.active = false;
        }
    }

    draw(context) {
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

