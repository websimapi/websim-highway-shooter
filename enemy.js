import { checkCollision } from 'collision';
import * as THREE from 'three';

export default class Enemy {
    constructor(game, x, y, type = 'green') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;

        this.baseWidth = this.game.width * 0.08;
        
        if (this.type === 'red') {
            this.baseWidth *= 1.2; // A bit bigger
            this.speed = (0.05 + Math.random() * 0.03) * 0.5; // Slower
            this.health = 20; // 10x more HP
            this.maxHealth = 20;
            // this.image is now a getter
            this.texture = this.game.assets.redEnemyTexture;
        } else { // Default green enemy
            this.speed = 0.05 + Math.random() * 0.03; // pixels per ms
            this.health = 2;
            this.maxHealth = 2;
            // this.image is now a getter
            this.texture = this.game.assets.enemyTexture;
        }

        this.baseHeight = this.baseWidth;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.active = true;
        this.rotation = 0; // Required for collision detection function

        // Animation properties for pulsing/bouncing
        this.animationTimer = Math.random() * Math.PI * 2; // Random start phase
        this.animationSpeed = 0.005; // How fast it pulses
        this.pulseAmount = 0.1; // How much it scales (10%)

        const geometry = new THREE.PlaneGeometry(this.width, this.height);
        const material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x - this.game.width / 2, this.y * -1 + this.game.height / 2, 1);
        this.game.scene.add(this.mesh);

        // Health bar
        const healthBarGeo = new THREE.PlaneGeometry(this.width, 5);
        this.healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBarMesh = new THREE.Mesh(healthBarGeo, this.healthBarMaterial);
        
        const healthBarBgGeo = new THREE.PlaneGeometry(this.width, 5);
        const healthBarBgMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.healthBarBgMesh = new THREE.Mesh(healthBarBgGeo, healthBarBgMat);

        this.healthBarBgMesh.position.z = -0.1; // ensure it's behind the green bar
        this.healthBarContainer = new THREE.Group();
        this.healthBarContainer.add(this.healthBarBgMesh);
        this.healthBarContainer.add(this.healthBarMesh);
        this.healthBarContainer.visible = false;
        this.mesh.add(this.healthBarContainer);
    }

    get image() {
        return this.type === 'red' ? this.game.assets.redEnemyImage : this.game.assets.enemyImage;
    }

    update(deltaTime) {
        if (!this.active) return;

        // --- Animation ---
        this.animationTimer += this.animationSpeed * deltaTime;
        const scale = 1 + Math.sin(this.animationTimer) * this.pulseAmount;
        
        const oldWidth = this.width;

        this.width = this.baseWidth * scale;
        this.height = this.baseHeight * scale;

        // Adjust position to keep the center stable during scaling
        this.x += (oldWidth - this.width) / 2;

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
        
        this.x += moveX;
        this.y += moveY;

        // --- Interaction with Barriers ---
        for (const barrier of this.game.barriers) {
             // Broad-phase AABB check
            if (
                this.x < barrier.x + barrier.width &&
                this.x + this.width > barrier.x &&
                this.y < barrier.y + barrier.height &&
                this.y + this.height > barrier.y
            ) {
                // If the enemy's top edge is "behind" the barrier's front edge, push it forward.
                const barrierFrontEdgeY = barrier.y + barrier.height;
                if (this.y < barrierFrontEdgeY) {
                    this.y = barrierFrontEdgeY;
                }
            }
        }

        // --- Keep within bounds ---
        this.x = Math.max(0, Math.min(this.game.width - this.width, this.x));

        // Sync 3D object
        this.mesh.scale.set(scale, scale, 1);
        this.mesh.position.x = this.x - this.game.width / 2 + this.width / 2;
        this.mesh.position.y = this.y * -1 + this.game.height / 2 - this.height / 2;
        this.healthBarContainer.position.y = this.height / 2 + 10;
    }

    draw(context) {
        // Now handled by Three.js render loop
    }

    hit() {
        this.health--;
        if (this.health < this.maxHealth) {
            this.healthBarContainer.visible = true;
            const healthRatio = this.health / this.maxHealth;
            this.healthBarMesh.scale.x = healthRatio;
            this.healthBarMesh.position.x = -(this.width * (1 - healthRatio)) / 2;
        }
        if (this.health <= 0) {
            this.active = false;
        }
    }

    destroy() {
         if (this.mesh) {
            this.game.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            if (this.healthBarMesh) {
                this.healthBarMesh.geometry.dispose();
                this.healthBarMaterial.dispose();
                this.healthBarBgMesh.geometry.dispose();
                this.healthBarBgMesh.material.dispose();
            }
            this.mesh = null;
        }
    }
}