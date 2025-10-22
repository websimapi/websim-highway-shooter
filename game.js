import Player from './player.js';
import InputHandler from './input.js';
import Barrel from './barrel.js';
import { checkCollision } from './collision.js';
import AudioPlayer from './audio.js';

export default class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.player = new Player(this);
        this.input = new InputHandler(this);
        this.audio = new AudioPlayer();
        this.projectiles = [];
        this.barrels = [];
        this.barrelTimer = 0;
        this.barrelInterval = 2000; // ms
        this.gameOver = false;
        this.score = 0;
        this.onGameOver = () => {};
        this.onScoreUpdate = () => {};
    }

    update(deltaTime) {
        if (this.gameOver) return;

        this.player.update(deltaTime, this.input.targetX);

        // Update and filter projectiles
        this.projectiles = this.projectiles.filter(p => p.active);
        this.projectiles.forEach(p => p.update(deltaTime));

        // Spawn and update barrels
        if (this.barrelTimer > this.barrelInterval) {
            this.spawnBarrelGroup();
            this.barrelTimer = 0;
            if(this.barrelInterval > 500) this.barrelInterval *= 0.99;
        } else {
            this.barrelTimer += deltaTime;
        }
        this.barrels = this.barrels.filter(b => b.active);
        this.barrels.forEach(b => b.update(deltaTime));

        // Collision detection
        this.projectiles.forEach(projectile => {
            this.barrels.forEach(barrel => {
                if (checkCollision(projectile, barrel)) {
                    projectile.active = false;
                    barrel.hit();
                    if(!barrel.active) {
                        this.score += barrel.maxHealth;
                        this.onScoreUpdate(this.score);
                        this.audio.play('destroy');
                    } else {
                        this.audio.play('hit');
                    }
                }
            });
        });

        // Check for player collision with barrels
        this.barrels.forEach(barrel => {
            if (checkCollision(this.player, barrel)) {
                this.gameOver = true;
                this.onGameOver(this.score);
            }
        });
    }

    draw(context) {
        // Draw background (lanes)
        const laneWidth = this.width / 3;
        context.fillStyle = '#444';
        context.fillRect(laneWidth, 0, 2, this.height);
        context.fillRect(laneWidth * 2, 0, 2, this.height);

        this.player.draw(context);
        this.projectiles.forEach(p => p.draw(context));
        this.barrels.forEach(b => b.draw(context));
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
        this.audio.play('shoot');
    }

    spawnBarrelGroup() {
        const lane = Math.floor(Math.random() * 3); // Pick one lane for the group
        const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 barrels in the group

        const subLanes = [0, 1, 2];

        // Shuffle subLanes array to pick random positions within the lane
        for (let i = subLanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [subLanes[i], subLanes[j]] = [subLanes[j], subLanes[i]];
        }

        const selectedSubLanes = subLanes.slice(0, count);

        const yOffset = -100; // All barrels in a row start at the same Y, offscreen
        const speed = Math.random() * 0.1 + 0.1; // Common speed for the group

        for (const subLane of selectedSubLanes) {
            this.barrels.push(new Barrel(this, lane, subLane, yOffset, speed));
        }
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.player.resize();
    }
}