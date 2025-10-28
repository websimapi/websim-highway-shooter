import Projectile from 'projectile';
import * as THREE from 'three';

export default class Player {
    constructor(game) {
        this.game = game;
        this.resize();
        this.speed = 0.5; // pixels per ms
        
        // These are used for collision detection, not rendering.
        // this.image is now a getter
        this.motorcycleImage = this.game.assets.playerImage;
        this.weaponImage = this.game.assets.weaponImage;

        this.baseShootCooldown = 200; // ms
        this.shootCooldown = this.baseShootCooldown;
        this.shootTimer = 0;
        
        // Power-up state
        this.isRapidFireActive = false;
        this.rapidFireTimer = 0;
        this.rapidFireDuration = 5000; // 5 seconds
        
        this.bombCount = 1;
        this.maxBombs = 3;

        this.rotation = 0;
        this.maxRotation = 15 * (Math.PI / 180); // 15 degrees in radians
        this.rotationSpeed = 0.005; // Smoothing factor for rotation

        this.mesh = null; // Will be created when assets are loaded
    }

    get image() {
        return this.game.assets.playerImage;
    }

    onAssetsLoaded() {
        // this.image = this.game.assets.playerImage; // No longer needed
        this.motorcycleImage = this.game.assets.playerImage;
        this.weaponImage = this.game.assets.weaponImage;
        this.createMesh();
    }

    createMesh() {
        if (this.mesh) {
            this.game.scene.remove(this.mesh);
        }

        const bikeWidth = this.width;
        const bikeHeight = this.height;

        // Player Group
        this.mesh = new THREE.Group();
        this.mesh.position.z = 2; // Make sure player is rendered on top of most things
        this.game.scene.add(this.mesh);

        // Motorcycle Mesh
        const motorcycleGeo = new THREE.PlaneGeometry(bikeWidth, bikeHeight);
        const motorcycleMat = new THREE.MeshBasicMaterial({ map: this.game.assets.playerTexture, transparent: true });
        this.motorcycleMesh = new THREE.Mesh(motorcycleGeo, motorcycleMat);
        this.mesh.add(this.motorcycleMesh);

        // Weapon Mesh
        const weaponWidth = bikeWidth * 0.8;
        const weaponHeight = bikeHeight * 0.8;
        const weaponGeo = new THREE.PlaneGeometry(weaponWidth, weaponHeight);
        const weaponMat = new THREE.MeshBasicMaterial({ map: this.game.assets.weaponTexture, transparent: true });
        this.weaponMesh = new THREE.Mesh(weaponGeo, weaponMat);
        this.weaponMesh.position.y = bikeHeight * 0.1;
        this.weaponMesh.position.z = 0.1; // Slightly in front of bike
        this.mesh.add(this.weaponMesh);
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
        
        // Determine target rotation based on movement direction
        let targetRotation = 0;
        const deadZone = 1; // pixels, to prevent jittering
        if (dx < -deadZone) {
            targetRotation = -this.maxRotation;
        } else if (dx > deadZone) {
            targetRotation = this.maxRotation;
        }

        // Smoothly interpolate to the target rotation
        this.rotation += (targetRotation - this.rotation) * this.rotationSpeed * deltaTime;

        if (Math.abs(dx) < moveDistance) {
            this.x = targetX - this.width / 2;
        } else {
            this.x += Math.sign(dx) * moveDistance;
        }

        // Clamp player position to screen bounds
        this.x = Math.max(0, Math.min(this.game.width - this.width, this.x));

        // Sync 3D object
        this.mesh.position.x = this.x + this.width / 2 - this.game.width / 2;
        this.mesh.position.y = -this.y - this.height / 2 + this.game.height / 2;
        this.mesh.rotation.z = this.rotation;

        // Automatic shooting
        if (this.shootTimer > this.shootCooldown) {
            this.shoot();
            this.shootTimer = 0;
        } else {
            this.shootTimer += deltaTime;
        }
        
        // Update power-ups
        if (this.isRapidFireActive) {
            this.rapidFireTimer -= deltaTime;
            this.game.onPowerUpUpdate(true, this.rapidFireTimer);
            if (this.rapidFireTimer <= 0) {
                this.deactivateRapidFire();
            }
        }
    }

    draw(context) {
        // Handled by Three.js render loop
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

    useBomb() {
        if (this.bombCount > 0) {
            this.bombCount--;
            this.game.triggerBomb();
            this.game.onBombUpdate(this.bombCount);
        }
    }

    addBomb() {
        if (this.bombCount < this.maxBombs) {
            this.bombCount++;
            this.game.onBombUpdate(this.bombCount);
        }
    }

    activateRapidFire() {
        this.isRapidFireActive = true;
        this.rapidFireTimer = this.rapidFireDuration;
        this.shootCooldown = this.baseShootCooldown / 2; // Double the fire rate
        this.game.onPowerUpUpdate(true, this.rapidFireTimer);
    }

    deactivateRapidFire() {
        this.isRapidFireActive = false;
        this.shootCooldown = this.baseShootCooldown;
        this.game.onPowerUpUpdate(false, 0);
    }
}