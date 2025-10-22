import Player from 'player';
import InputHandler from 'input';
import Barrel from 'barrel';
import { checkCollision } from 'collision';
import AudioPlayer from 'audio';
import Enemy from 'enemy';
import PowerUp from 'powerup';
import { generateMask } from 'collisionMask';

export default class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.player = new Player(this);
        this.input = new InputHandler(this);
        this.audio = new AudioPlayer();
        this.projectiles = [];
        this.barrels = [];
        this.enemies = [];
        this.powerups = [];
        this.barrelTimer = 0;
        this.barrelInterval = 2000; // ms
        this.enemyTimer = 5000; // Time before first enemy cluster
        this.enemyInterval = 12000; // Time between enemy clusters
        this.gameOver = false;
        this.score = 0;
        this.onGameOver = () => {};
        this.onScoreUpdate = () => {};
        this.onPowerUpUpdate = () => {};
        this.assetsLoaded = false;
        this.loadAssets();
    }

    async loadAssets() {
        const assetPromises = [
            this.player.motorcycleImage,
            this.player.weaponImage,
            new Image(), // barrel
            new Image(), // enemy
            new Image(), // projectile
            new Image(), // powerup
        ];
        assetPromises[2].src = 'barrel.png';
        assetPromises[3].src = 'enemy.png';
        assetPromises[4].src = 'projectile.png';
        assetPromises[5].src = 'rapid_fire.png';

        await Promise.all(assetPromises.map(img => new Promise(resolve => {
            if(img.complete) resolve();
            else img.onload = resolve;
        })));

        // Generate masks after all images are loaded
        generateMask(assetPromises[0]);
        generateMask(assetPromises[1]);
        generateMask(assetPromises[2]);
        generateMask(assetPromises[3]);
        generateMask(assetPromises[4]);
        generateMask(assetPromises[5]);

        this.assetsLoaded = true;
    }

    update(deltaTime) {
        if (this.gameOver || !this.assetsLoaded) return;

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

        // Spawn and update enemies
        if (this.enemyTimer > this.enemyInterval) {
            this.spawnEnemyCluster();
            this.enemyTimer = 0;
        } else {
            this.enemyTimer += deltaTime;
        }
        this.enemies = this.enemies.filter(e => e.active);
        this.enemies.forEach(e => e.update(deltaTime));

        // Spawn and update powerups
        this.powerups = this.powerups.filter(p => p.active);
        this.powerups.forEach(p => p.update(deltaTime));

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
                        if (barrel.hasPowerUp) {
                           this.spawnPowerUp(barrel.x + barrel.width / 2, barrel.y + barrel.height / 2, barrel.powerUpType);
                        }
                    } else {
                        this.audio.play('hit');
                    }
                }
            });

            this.enemies.forEach(enemy => {
                 if (checkCollision(projectile, enemy)) {
                    projectile.active = false;
                    enemy.hit();
                    if(!enemy.active) {
                        this.score += enemy.maxHealth * 5; // Enemies are worth more
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

        // Check for player collision with enemies
        this.enemies.forEach(enemy => {
            if (checkCollision(this.player, enemy)) {
                this.gameOver = true;
                this.onGameOver(this.score);
            }
        });

        // Check for player collision with powerups
        this.powerups.forEach(powerup => {
            if (checkCollision(this.player, powerup)) {
                powerup.active = false;
                if(powerup.type === 'rapidFire') {
                    this.player.activateRapidFire();
                }
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
        this.enemies.forEach(e => e.draw(context));
        this.powerups.forEach(p => p.draw(context));
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

    spawnPowerUp(x, y, type) {
        this.powerups.push(new PowerUp(this, x, y, type));
    }

    spawnEnemyCluster() {
        const CLUSTER_SIZE = 20;
        const lane = Math.floor(Math.random() * 3);
        const laneWidth = this.width / 3;
        const laneStartX = lane * laneWidth;

        for (let i = 0; i < CLUSTER_SIZE; i++) {
            // Spawn in a random position within the chosen lane, off-screen
            const x = laneStartX + Math.random() * (laneWidth - this.player.width);
            const y = -100 - Math.random() * 300; // Stagger their vertical start
            this.enemies.push(new Enemy(this, x, y));
        }
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.player.resize();
    }
}