import * as THREE from 'three';

export default class Barrier {
    constructor(game, lane) {
        this.game = game;
        this.lane = lane;

        const laneWidth = this.game.width / 3;
        this.width = laneWidth;
        this.height = this.width / 5; 
        
        const laneStartX = lane * laneWidth;
        this.x = laneStartX;
        
        this.y = -this.height; // Start off-screen
        this.speedY = Math.random() * 0.05 + 0.08;
        this.maxHealth = Math.floor(Math.random() * 10) + 1;
        this.health = this.maxHealth;
        this.active = true;
        this.rotation = 0;
        
        // --- Power-up Logic ---
        this.hasPowerUp = Math.random() < 0.1; // 1 in 10 chance to have a power-up
        if (this.hasPowerUp) {
            // Relative weights: bomb = 1/30, rapidFire = 1/10 = 3/30.
            // Total weight is 4. Bomb's chance is 1/4.
            const bombChance = (1 / 30);
            const rapidFireChance = (1 / 10);
            const totalWeight = bombChance + rapidFireChance;
            const bombProbability = bombChance / totalWeight; // Should be 0.25

            this.powerUpType = Math.random() < bombProbability ? 'bomb' : 'rapidFire';
        } else {
            this.powerUpType = null;
        }
        
        // this.image is now a getter

        // Three.js setup
        const geometry = new THREE.PlaneGeometry(this.width, this.height);
        const material = new THREE.MeshBasicMaterial({ map: this.game.assets.barrierTexture, transparent: true });
        this.mesh = new THREE.Mesh(geometry, material);

        this.game.scene.add(this.mesh);

        // Health text - using canvas texture
        this.textCanvas = document.createElement('canvas');
        this.textCanvas.width = 256;
        this.textCanvas.height = 128;
        this.textContext = this.textCanvas.getContext('2d');
        this.textTexture = new THREE.CanvasTexture(this.textCanvas);

        const textMaterial = new THREE.MeshBasicMaterial({ map: this.textTexture, transparent: true });
        const textGeometry = new THREE.PlaneGeometry(this.height * 1.5, this.height * 0.75);
        this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
        this.textMesh.position.z = 0.1; // In front of barrier
        this.mesh.add(this.textMesh);

        this.updateHealthText();
    }

    get image() {
        return this.game.assets.barrierImage;
    }

    update(deltaTime) {
        this.y += this.speedY * deltaTime;
        if (this.y > this.game.height) {
            this.active = false;
        }

        // Sync 3D position
        this.mesh.position.set(
            this.x + this.width / 2 - this.game.width / 2,
            -this.y - this.height / 2 + this.game.height / 2,
            0
        );
    }

    draw(context) {
        // Drawing is now handled by Three.js main loop
    }

    updateHealthText() {
        const ctx = this.textContext;
        ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${this.textCanvas.height * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 12;

        const textX = this.textCanvas.width / 2;
        const textY = this.textCanvas.height / 2;
        
        ctx.strokeText(this.health, textX, textY);
        ctx.fillText(this.health, textX, textY);
        this.textTexture.needsUpdate = true;
    }

    hit() {
        this.health--;
        if (this.health <= 0) {
            this.active = false;
        } else {
            this.updateHealthText();
        }
    }

    destroy() {
        if (this.mesh) {
            this.game.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.textMesh.geometry.dispose();
            this.textMesh.material.dispose();
            this.textTexture.dispose();
            this.mesh = null;
        }
    }
}