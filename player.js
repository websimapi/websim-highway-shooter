import Projectile from './projectile.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.resize();
        this.speed = 0.5; // pixels per ms
        this.motorcycleImage = new Image();
        this.motorcycleImage.src = 'player_ship.png';
        this.weaponImage = new Image();
        this.weaponImage.src = 'weapon.png';

        this.shootCooldown = 200; // ms
        this.shootTimer = 0;
    }

    resize() {
        this.width = Math.min(this.game.width * 0.15, 80);
        this.height = this.width;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height - this.height - 20;
    }

    update(deltaTime, targetX) {
        // Smooth movement towards targetX
        const dx = targetX - (this.x + this.width / 2);
        const moveDistance = this.speed * deltaTime;
        
        if (Math.abs(dx) < moveDistance) {
            this.x = targetX - this.width / 2;
        } else {
            this.x += Math.sign(dx) * moveDistance;
        }

        // Clamp player position to screen bounds
        this.x = Math.max(0, Math.min(this.game.width - this.width, this.x));

        // Automatic shooting
        if (this.shootTimer > this.shootCooldown) {
            this.shoot();
            this.shootTimer = 0;
        } else {
            this.shootTimer += deltaTime;
        }
    }

    draw(context) {
        context.drawImage(this.motorcycleImage, this.x, this.y, this.width, this.height);
        
        const weaponWidth = this.width * 0.8;
        const weaponHeight = this.height * 0.8;
        const weaponX = this.x + (this.width - weaponWidth) / 2;
        const weaponY = this.y - weaponHeight * 0.1;

        context.drawImage(this.weaponImage, weaponX, weaponY, weaponWidth, weaponHeight);
    }

    shoot() {
        const projectileX = this.x + this.width / 2 - 5;
        const projectileY = this.y;
        this.game.addProjectile(new Projectile(this.game, projectileX, projectileY));
    }
}