import { checkCollision } from './collision.js';

export default class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = this.game.width * 0.08;
        this.height = this.width;
        this.speed = 0.05 + Math.random() * 0.03; // pixels per ms
        this.health = 2;
        this.maxHealth = 2;
        this.active = true;

        this.image = new Image();
        this.image.src = 'enemy.png';
    }

    update(deltaTime) {
        if (!this.active) return;

        // --- Movement towards player ---
        const player = this.game.player;
        const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
        const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        let moveX = 0;
        let moveY = 0;

        if (distance > 1) {
            moveX = (dx / distance) * this.speed * deltaTime;
            moveY = (dy / distance) * this.speed * deltaTime;
        }
        
        const nextPos = {
            x: this.x + moveX,
            y: this.y + moveY,
            width: this.width,
            height: this.height
        };
        
        // --- Collision with Barrels ---
        let blocked = false;
        for (const barrel of this.game.barrels) {
            if (checkCollision(nextPos, barrel)) {
                blocked = true;
                break;
            }
        }
        
        if (!blocked) {
            this.x = nextPos.x;
            this.y = nextPos.y;
        } else {
             // If path is blocked, try to slide horizontally.
            const horizontalPos = { ...nextPos, y: this.y };
            let horizBlocked = false;
             for (const barrel of this.game.barrels) {
                if (checkCollision(horizontalPos, barrel)) {
                    horizBlocked = true;
                    break;
                }
            }
            if(!horizBlocked) this.x = horizontalPos.x;
        }

        // --- Keep within bounds ---
        this.x = Math.max(0, Math.min(this.game.width - this.width, this.x));
    }

    draw(context) {
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
        
        // Health bar
        if (this.health < this.maxHealth) {
            context.fillStyle = 'red';
            context.fillRect(this.x, this.y - 10, this.width, 5);
            context.fillStyle = 'green';
            context.fillRect(this.x, this.y - 10, this.width * (this.health / this.maxHealth), 5);
        }
    }

    hit() {
        this.health--;
        if (this.health <= 0) {
            this.active = false;
        }
    }
}