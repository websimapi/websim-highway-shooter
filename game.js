import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Player from 'player';
import InputHandler from 'input';
import Barrel from 'barrel';
import Barrier from 'barrier';
import Particle from 'particle';
import { checkCollision } from 'collision';
import AudioPlayer from 'audio';
import Enemy from 'enemy';
import PowerUp from 'powerup';
import { generateMask } from './collisionMask.js';

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

        const geometry = new THREE.RingGeometry(0, this.maxRadius, 64);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x - game.width / 2, -y + game.height / 2, 5);
        this.game.scene.add(this.mesh);
    }

    update(deltaTime) {
        this.lifeTimer += deltaTime;
        const progress = this.lifeTimer / this.duration;
        const currentRadius = progress * this.maxRadius;
        
        this.mesh.scale.set(progress, progress, 1);
        this.mesh.material.opacity = (1 - progress) * 0.5;
        
        if (this.lifeTimer >= this.duration) {
            this.active = false;
        }
    }

    draw(context) {
        // handled by three.js
    }

    destroy() {
        if (this.mesh) {
            this.game.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
    }
}

export default class Game {
    constructor(width, height, canvas) {
        this.width = width;
        this.height = height;

        // --- Three.js Setup ---
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.scene = new THREE.Scene();
        
        const cameraDistance = 1000;
        const fov = 2 * Math.atan((height / 2) / cameraDistance) * (180 / Math.PI);
        this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 2000);
        this.camera.position.set(0, 0, cameraDistance);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(-1, 1, 1);
        this.scene.add(directionalLight);

        this.assets = {};
        this.assetsLoaded = false;

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
        this.loadAssets();
        this.createBackground();
    }

    loadAssets() {
        const manager = new THREE.LoadingManager();
        const textureLoader = new THREE.TextureLoader(manager);
        const imageLoader = new THREE.ImageLoader(manager);

        const texturesToLoad = {
            playerTexture: 'player_ship.png',
            weaponTexture: 'weapon.png',
            barrelTexture: 'barrel_texture.png',
            enemyTexture: 'enemy.png',
            projectileTexture: 'projectile.png',
            rapidFireTexture: 'rapid_fire.png',
            barrierTexture: 'barrier.png',
            bombTexture: 'bomb.png',
        };

        const imagesToLoad = {
            // These share sources with textures, but are loaded as HTMLImageElements for collision masks
            playerImage: 'player_ship.png',
            weaponImage: 'weapon.png',
            enemyImage: 'enemy.png',
            projectileImage: 'projectile.png',
            rapidFireImage: 'rapid_fire.png',
            barrierImage: 'barrier.png',
            bombImage: 'bomb.png',
            // This one is unique and only used for a collision mask
            barrelImage: 'barrel.png',
        };

        // Load textures
        for (const key in texturesToLoad) {
            this.assets[key] = textureLoader.load(texturesToLoad[key]);
        }
        
        // Load images for collision masks
        for (const key in imagesToLoad) {
            imageLoader.load(imagesToLoad[key], (image) => {
                this.assets[key] = image;
            });
        }

        manager.onLoad = () => {
            // All assets are loaded, now generate collision masks
            Object.values(this.assets).forEach(asset => {
                if (asset instanceof HTMLImageElement) {
                    generateMask(asset);
                }
            });
            
            this.assetsLoaded = true;
            this.player.onAssetsLoaded();
        };
    }

    createBackground() {
        const laneWidth = this.width / 3;
        const laneMarkerGeo = new THREE.PlaneGeometry(4, this.height);
        const laneMarkerMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, opacity: 0.5, transparent: true });

        const marker1 = new THREE.Mesh(laneMarkerGeo, laneMarkerMat);
        marker1.position.x = -laneWidth / 2;
        
        const marker2 = new THREE.Mesh(laneMarkerGeo, laneMarkerMat);
        marker2.position.x = laneWidth / 2;

        this.scene.add(marker1);
        this.scene.add(marker2);
    }

    update(deltaTime) {
        if (this.gameOver || !this.assetsLoaded) return;

        this.player.update(deltaTime, this.input.targetX);

        // Update and filter projectiles
        this.projectiles.forEach(p => p.update(deltaTime));
        this.projectiles = this.projectiles.filter(p => {
            if (!p.active) p.destroy();
            return p.active;
        });

        // Spawn and update barrels/barriers
        if (this.barrelTimer > this.barrelInterval) {
            this.spawnObstacleGroup();
            this.barrelTimer = 0;
            if(this.barrelInterval > 500) this.barrelInterval *= 0.99;
        } else {
            this.barrelTimer += deltaTime;
        }
        this.barrels.forEach(b => b.update(deltaTime));
        this.barrels = this.barrels.filter(b => {
            if (!b.active) b.destroy();
            return b.active;
        });

        this.barriers.forEach(b => b.update(deltaTime));
        this.barriers = this.barriers.filter(b => {
            if (!b.active) b.destroy();
            return b.active;
        });

        this.particles = this.particles.filter(p => p.active);
        this.particles.forEach(p => p.update(deltaTime));

        // Spawn and update enemies
        if (this.enemyTimer > this.enemyInterval) {
            this.spawnEnemyCluster();
            this.enemyTimer = 0;
        } else {
            this.enemyTimer += deltaTime;
        }
        this.enemies.forEach(e => e.update(deltaTime));
        this.enemies = this.enemies.filter(e => {
            if(!e.active) e.destroy();
            return e.active;
        });

        // Spawn and update powerups
        this.powerups.forEach(p => p.update(deltaTime));
        this.powerups = this.powerups.filter(p => {
            if(!p.active) p.destroy();
            return p.active;
        });

        // Update bomb effects
        this.bombEffects.forEach(b => b.update(deltaTime));
        this.bombEffects = this.bombEffects.filter(b => {
            if (!b.active) b.destroy();
            return b.active;
        });

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

    draw() {
        if (!this.assetsLoaded) return;
        this.renderer.render(this.scene, this.camera);
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
                         if (object.hasPowerUp) this.spawnPowerUp(object.x + object.width / 2, object.y + object.height / 2);
                    } else if (object instanceof Barrier) {
                        this.score += object.maxHealth * 2;
                        this.audio.play('shatter');
                        this.createShatterEffect(object);
                         if (object.hasPowerUp) this.spawnPowerUp(object.x + object.width / 2, object.y + object.height / 2);
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

        this.camera.aspect = width / height;
        const fov = 2 * Math.atan((height / 2) / 1000) * (180 / Math.PI);
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    destroy() {
        // Cleanup all objects to prevent memory leaks on restart
        [...this.projectiles, ...this.barrels, ...this.barriers, ...this.particles, ...this.enemies, ...this.powerups, ...this.bombEffects].forEach(obj => {
            if(obj.destroy) obj.destroy();
        });
    }
}