import Player from 'player';
import InputHandler from 'input';
import Barrel from 'barrel';
import Barrier from 'barrier';
import Particle from 'particle';
import { checkCollision } from 'collision';
import AudioPlayer from 'audio';
import Enemy from 'enemy';
import PowerUp from 'powerup';
import { generateMask } from 'collisionMask';

class BombExplosionEffect {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = this.game.height / 2;
        this.duration = 400; // ms
        this.lifeTimer = 0;
        this.active = true;
    }

    update(deltaTime) {
        this.lifeTimer += deltaTime;
        this.radius = (this.lifeTimer / this.duration) * this.maxRadius;
        if (this.lifeTimer >= this.duration) {
            this.active = false;
        }
    }

    draw(context) {
        const opacity = 1 - (this.lifeTimer / this.duration);
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
        context.fill();
    }
}

export default class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.player = new Player(this);
        this.input = new InputHandler(this);
        this.audio = new AudioPlayer();
        this.projectiles = [];
        this.barrels = [];
        this.barriers = [];
        this.particles = [];
        this.enemies = [];
        this.powerups = [];
        this.bombEffects = [];
        this.barrelTimer = 0;
        this.barrelInterval = 2000; // ms
        this.enemyTimer = 5000; // Time before first enemy cluster
        this.enemyInterval = 12000; // Time between enemy clusters
        this.gameOver = false;
        this.score = 0;
        this.onGameOver = () => {};
        this.onScoreUpdate = () => {};
        this.onPowerUpUpdate = () => {};
        this.onBombUpdate = () => {};
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
            new Image(), // rapidfire powerup
            new Image(), // barrier
            new Image(), // bomb powerup
        ];
        assetPromises[2].src = 'barrel.png';
        assetPromises[3].src = 'enemy.png';
        assetPromises[4].src = 'projectile.png';
        assetPromises[5].src = 'rapid_fire.png';
        assetPromises[6].src = 'barrier.png';
        assetPromises[7].src = 'bomb.png';

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
        // Barrier image might not need a mask if it's a simple rectangle, but good practice.
        generateMask(assetPromises[6]);
        generateMask(assetPromises[7]);

        this.assetsLoaded = true;
    }

    update(deltaTime) {
        if (this.gameOver || !this.assetsLoaded) return;

        this.player.update(deltaTime, this.input.targetX);

        // Update and filter projectiles
        this.projectiles = this.projectiles.filter(p => p.active);
        this.projectiles.forEach(p => p.update(deltaTime));

        // Spawn and update barrels/barriers
        if (this.barrelTimer > this.barrelInterval) {
            this.spawnObstacleGroup();
            this.barrelTimer = 0;
            if(this.barrelInterval > 500) this.barrelInterval *= 0.99;
        } else {
            this.barrelTimer += deltaTime;
        }
        this.barrels = this.barrels.filter(b => b.active);
        this.barrels.forEach(b => b.update(deltaTime));

        this.barriers = this.barriers.filter(b => b.active);
        this.barriers.forEach(b => b.update(deltaTime));

        this.particles = this.particles.filter(p => p.active);
        this.particles.forEach(p => p.update(deltaTime));

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

        // Update bomb effects
        this.bombEffects = this.bombEffects.filter(b => b.active);
        this.bombEffects.forEach(b => b.update(deltaTime));

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
                           this.spawnPowerUp(barrel.x + barrel.width / 2, barrel.y + barrel.height / 2);
                        }
                    } else {
                        this.audio.play('hit');
                    }
                }
            });

            this.barriers.forEach(barrier => {
                if (checkCollision(projectile, barrier)) {
                    projectile.active = false;
                    barrier.hit();
                    if (!barrier.active) {
                        this.score += barrier.maxHealth * 2;
                        this.onScoreUpdate(this.score);
                        this.audio.play('shatter');
                        this.createShatterEffect(barrier);
                        if (barrier.hasPowerUp) {
                            this.spawnPowerUp(barrier.x + barrier.width / 2, barrier.y + barrier.height / 2);
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

        // Check for player collision with barriers
        this.barriers.forEach(barrier => {
            if (checkCollision(this.player, barrier)) {
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
                } else if (powerup.type === 'bomb') {
                    this.audio.play('bomb_pickup');
                    this.player.addBomb();
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
        this.barriers.forEach(b => b.draw(context));
        this.enemies.forEach(e => e.draw(context));
        this.powerups.forEach(p => p.draw(context));
        this.particles.forEach(p => p.draw(context));
        this.bombEffects.forEach(b => b.draw(context));
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
        this.audio.play('shoot');
    }

    spawnObstacleGroup() {
        // 1 in 10 chance to spawn a barrier instead of barrels
        if (Math.random() < 0.1) {
            this.spawnBarrier();
        } else {
            this.spawnBarrelGroup();
        }
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

    spawnBarrier() {
        const lane = Math.floor(Math.random() * 3);
        this.barriers.push(new Barrier(this, lane));
    }

    spawnPowerUp(x, y) {
        const type = Math.random() < 0.5 ? 'rapidFire' : 'bomb';
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

    triggerBomb() {
        const playerX = this.player.x + this.player.width / 2;
        const playerY = this.player.y + this.player.height / 2;
        const radius = this.height / 2;
        const radiusSq = radius * radius;

        this.audio.play('bomb_explosion');
        this.bombEffects.push(new BombExplosionEffect(this, playerX, playerY));

        const checkAndDestroy = (object) => {
            const objX = object.x + object.width / 2;
            const objY = object.y + object.height / 2;
            const dx = playerX - objX;
            const dy = playerY - objY;
            
            if ((dx * dx + dy * dy) < radiusSq) {
                if (object.active) {
                    object.active = false;
                    // Specific destruction logic
                    if (object instanceof Barrel) {
                         this.score += object.maxHealth;
                         this.audio.play('destroy');
                         if (object.hasPowerUp) this.spawnPowerUp(object.x, object.y);
                    } else if (object instanceof Barrier) {
                        this.score += object.maxHealth * 2;
                        this.audio.play('shatter');
                        this.createShatterEffect(object);
                        if (object.hasPowerUp) this.spawnPowerUp(object.x, object.y);
                    } else if (object instanceof Enemy) {
                        this.score += object.maxHealth * 5;
                        this.audio.play('destroy');
                    }
                }
            }
        };

        this.barrels.forEach(checkAndDestroy);
        this.barriers.forEach(checkAndDestroy);
        this.enemies.forEach(checkAndDestroy);
        this.onScoreUpdate(this.score);
    }

    createShatterEffect(source) {
        const PARTICLE_COUNT = 30;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const x = source.x + Math.random() * source.width;
            const y = source.y + Math.random() * source.height;
            this.particles.push(new Particle(this, x, y));
        }
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.player.resize();
    }
}