import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Player from 'player';
import InputHandler from 'input';
import Barrel from 'barrel';
import Barrier from 'barrier';
import Particle from 'particle';
import AudioPlayer from 'audio';
import Enemy from 'enemy';
import PowerUp from 'powerup';
import { generateMask } from './collisionMask.js';
import Spawner from 'spawner';
import CollisionHandler from 'collision-handler';
import EffectManager from 'effect-manager';
import BombExplosionEffect from 'bomb-explosion-effect';
import ReplayRecorder from 'replay-recorder';

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
        this.spawner = new Spawner(this);
        this.effectManager = new EffectManager(this);
        this.collisionHandler = new CollisionHandler(this);
        this.recorder = new ReplayRecorder(this);

        this.projectiles = [];
        this.barrels = [];
        this.barriers = [];
        this.particles = [];
        this.enemies = [];
        this.powerups = [];
        this.bombEffects = [];
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
            redEnemyTexture: 'red_enemy.png',
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
            redEnemyImage: 'red_enemy.png',
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
            this.resizeBackground(); // Set initial background size
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

        this.laneMarker1 = marker1;
        this.laneMarker2 = marker2;

        this.scene.add(this.laneMarker1);
        this.scene.add(this.laneMarker2);
    }

    update(deltaTime) {
        if (this.gameOver || !this.assetsLoaded) return;

        this.recorder.recordFrame();

        this.player.update(deltaTime, this.input.targetX);
        this.spawner.update(deltaTime);

        // Update all game objects
        const updateAndFilter = (arr) => {
            arr.forEach(item => item.update(deltaTime));
            return arr.filter(item => {
                if (!item.active) item.destroy();
                return item.active;
            });
        };

        this.projectiles = updateAndFilter(this.projectiles);
        this.barrels = updateAndFilter(this.barrels);
        this.barriers = updateAndFilter(this.barriers);
        this.enemies = updateAndFilter(this.enemies);
        this.powerups = updateAndFilter(this.powerups);
        this.bombEffects = updateAndFilter(this.bombEffects);
        
        // Particles are handled slightly differently as they self-destroy in their update
        this.particles.forEach(p => p.update(deltaTime));
        this.particles = this.particles.filter(p => p.active);

        // Collision detection
        this.collisionHandler.checkCollisions();
    }

    draw() {
        if (!this.assetsLoaded) return;
        this.renderer.render(this.scene, this.camera);
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
        this.audio.play('shoot');
        this.recorder.recordEvent('shoot', { x: projectile.x, y: projectile.y });
    }

    triggerBomb() {
        const playerX = this.player.x + this.player.width / 2;
        const playerY = this.player.y + this.player.height / 2;
        const radius = this.height / 2;
        const radiusSq = radius * radius;

        this.audio.play('bomb_explosion');
        this.recorder.recordEvent('bomb_explosion', { x: playerX, y: playerY });

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
                         if (object.hasPowerUp) this.spawner.spawnPowerUp(object.x + object.width / 2, object.y + object.height / 2);
                    } else if (object instanceof Barrier) {
                        this.score += object.maxHealth * 2;
                        this.audio.play('shatter');
                        this.effectManager.createShatterEffect(object);
                         if (object.hasPowerUp) this.spawner.spawnPowerUp(object.x + object.width / 2, object.y + object.height / 2);
                    } else if (object instanceof Enemy) {
                        this.score += object.maxHealth * 5;
                        this.audio.play('destroy');
                        this.effectManager.createMonsterExplosionEffect(object);
                    }
                }
            }
        };

        this.barrels.forEach(checkAndDestroy);
        this.barriers.forEach(checkAndDestroy);
        this.enemies.forEach(checkAndDestroy);
        this.onScoreUpdate(this.score);

        // Also add a visual explosion effect
        this.bombEffects.push(new BombExplosionEffect(this, playerX, playerY));
    }
    
    resizeBackground() {
        if (!this.laneMarker1 || !this.laneMarker2) return;
        
        // This is a more robust way to handle the background for Three.js
        this.laneMarker1.geometry.dispose();
        this.laneMarker2.geometry.dispose();
        this.laneMarker1.geometry = new THREE.PlaneGeometry(4, this.height);
        this.laneMarker2.geometry = new THREE.PlaneGeometry(4, this.height);

        this.laneMarker1.position.x = -this.width / 6;
        this.laneMarker2.position.x = this.width / 6;
    }
    
    resize(width, height, oldWidth, oldHeight) {
        this.width = width;
        this.height = height;
        this.input.resize(oldWidth);

        // Resize all game objects
        this.player.resize(oldWidth, oldHeight);
        
        const resizeObjects = (arr) => arr.forEach(obj => {
            if (obj.resize) obj.resize(oldWidth, oldHeight);
        });
        resizeObjects(this.barrels);
        resizeObjects(this.barriers);
        resizeObjects(this.enemies);
        resizeObjects(this.powerups);
        resizeObjects(this.projectiles);
        
        // The spawner doesn't hold objects, but its internal logic might depend on screen size in the future.
        // For now it seems okay without a resize method.
        // this.spawner.resize(oldWidth, oldHeight);

        this.resizeBackground();

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