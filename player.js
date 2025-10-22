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

        this.rotation = 0;
        this.maxRotation = Math.PI / 18; // 10 degrees
        this.rotationSpeed = 0.005; // radians per ms
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
        
        const prevX = this.x;

        if (Math.abs(dx) < moveDistance) {
            this.x = targetX - this.width / 2;
        } else {
            this.x += Math.sign(dx) * moveDistance;
        }

        // Clamp player position to screen bounds
        this.x = Math.max(0, Math.min(this.game.width - this.width, this.x));
        
        const actualDx = this.x - prevX;
        let targetRotation = 0;

        if (actualDx < -0.1) { // Moving left
            targetRotation = -this.maxRotation;
        } else if (actualDx > 0.1) { // Moving right
            targetRotation = 0; // Normal position as requested
        } else { // Not moving
            targetRotation = 0;
        }

        // Smoothly interpolate rotation
        const rotationDiff = targetRotation - this.rotation;
        if (Math.abs(rotationDiff) > 0.01) {
            this.rotation += rotationDiff * this.rotationSpeed * deltaTime;
        } else {
            this.rotation = targetRotation;
        }

        // Automatic shooting
        if (this.shootTimer > this.shootCooldown) {
            this.shoot();
            this.shootTimer = 0;
        } else {
            this.shootTimer += deltaTime;
        }
    }

    draw(context) {
        context.save();
        
        // Translate to the center of the player for rotation
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        context.translate(centerX, centerY);
        context.rotate(this.rotation);
        context.translate(-centerX, -centerY);

        context.drawImage(this.motorcycleImage, this.x, this.y, this.width, this.height);
        
        const weaponWidth = this.width * 0.8;
        const weaponHeight = this.height * 0.8;
        const weaponX = this.x + (this.width - weaponWidth) / 2;
        const weaponY = this.y - weaponHeight * 0.1;

        context.drawImage(this.weaponImage, weaponX, weaponY, weaponWidth, weaponHeight);
        
        context.restore();
    }

    shoot() {
        const weaponWidth = this.width * 0.8;
        const weaponHeight = this.height * 0.8;
        const weaponX = this.x + (this.width - weaponWidth) / 2;
        const weaponY = this.y - weaponHeight * 0.1;

        const projectileWidth = 10; // from projectile.js
        const projectileX = weaponX + (weaponWidth / 2) - (projectileWidth / 2);
        const projectileY = weaponY; // From the top of the weapon

        this.game.addProjectile(new Projectile(this.game, projectileX, projectileY));
    }
}