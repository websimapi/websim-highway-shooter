import * as THREE from 'three';

export default class Barrel {
    constructor(game, lane, subLane, yOffset = 0, speed = null) {
        this.game = game;
        this.lane = lane;
        this.subLane = subLane;

        const laneWidth = this.game.width / 3;
        const subLaneWidth = laneWidth / 3;

        this.width = subLaneWidth * 0.85;
        this.height = this.width;
        
        const laneStartX = lane * laneWidth;
        
        this.x = laneStartX + (subLane * subLaneWidth) + (subLaneWidth / 2) - (this.width / 2);
        
        this.y = yOffset; // Start at the given yOffset
        this.speedY = speed !== null ? speed : Math.random() * 0.1 + 0.1;
        this.maxHealth = Math.floor(Math.random() * 5) + 1;
        this.health = this.maxHealth;
        this.active = true;
        this.meshRotation = 0;
        this.rotationSpeed = this.speedY * 0.05;
        
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
        this.rotation = 0; // for collision function

        // --- Three.js Object ---
        const radius = this.width / 2;
        const geometry = new THREE.CylinderGeometry(radius, radius, this.width, 16);
        const material = new THREE.MeshStandardMaterial({ map: this.game.assets.barrelTexture });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.z = Math.PI / 2; // Lay it on its side, along the X-axis
        this.game.scene.add(this.mesh);

        // Health text
        this.textCanvas = document.createElement('canvas');
        this.textCanvas.width = 128;
        this.textCanvas.height = 128;
        this.textContext = this.textCanvas.getContext('2d');
        this.textTexture = new THREE.CanvasTexture(this.textCanvas);
        const textMaterial = new THREE.MeshBasicMaterial({ map: this.textTexture, transparent: true });
        const textGeometry = new THREE.PlaneGeometry(this.width * 0.7, this.height * 0.7);
        this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
        // Add the text mesh directly to the scene, not as a child of the barrel
        this.game.scene.add(this.textMesh);

        this.updateHealthText();
    }

    get image() {
        return this.game.assets.barrelImage;
    }

    update(deltaTime) {
        this.meshRotation += this.rotationSpeed * deltaTime;
        let potentialY = this.y + this.speedY * deltaTime;
        
        // Find the closest barrel in front of this one in the same sub-lane.
        let leadingBarrel = null;
        let minDistance = Infinity;

        for (const other of this.game.barrels) {
            if (other === this || other.lane !== this.lane || other.subLane !== this.subLane) {
                continue;
            }
            // Check if 'other' is in front of 'this'
            if (other.y > this.y) {
                const distance = other.y - this.y;
                if (distance < minDistance) {
                    minDistance = distance;
                    leadingBarrel = other;
                }
            }
        }

        // If there is a barrel in front, make sure we don't collide with it.
        if (leadingBarrel) {
            // The minimum distance is one barrel height plus a small gap.
            const safeDistance = leadingBarrel.height + 2; 
            const maxAllowedY = leadingBarrel.y - safeDistance;
            
            // If moving would cause an overlap, adjust position.
            if (potentialY > maxAllowedY) {
                // If we are already too close (e.g., from spawning), don't move back, just stay put or move with the leader.
                if (this.y < maxAllowedY) {
                     this.y = maxAllowedY;
                }
                // Match the speed of the barrel in front to maintain distance.
                this.speedY = leadingBarrel.speedY;
                // Recalculate movement with the new speed.
                this.y += this.speedY * deltaTime;
            } else {
                this.y = potentialY;
            }
        } else {
            this.y = potentialY;
        }

        if (this.y > this.game.height) {
            this.active = false;
        }

        // Sync 3D object position and rotation
        const meshX = this.x + this.width / 2 - this.game.width / 2;
        const meshY = -this.y - this.height / 2 + this.game.height / 2;
        
        this.mesh.position.set(meshX, meshY, 0);
        this.mesh.rotation.x = this.meshRotation;

        // Manually update the text position to follow the barrel without rotating
        const radius = this.width / 2;
        this.textMesh.position.set(meshX, meshY, radius + 1); // Position in front
    }

    draw(context) {
        // This is now handled by the main Three.js render loop in game.js
    }
    
    resize(oldGameWidth, oldGameHeight) {
        const yRatio = oldGameHeight > 0 ? (this.y + this.height / 2) / oldGameHeight : 0;

        const laneWidth = this.game.width / 3;
        const subLaneWidth = laneWidth / 3;

        const oldWidth = this.width;
        this.width = subLaneWidth * 0.85;
        this.height = this.width;

        const laneStartX = this.lane * laneWidth;
        this.x = laneStartX + (this.subLane * subLaneWidth) + (subLaneWidth / 2) - (this.width / 2);
        this.y = (this.game.height * yRatio) - (this.height / 2);

        // Re-scale the mesh
        if (oldWidth > 0) {
            const scaleFactor = this.width / oldWidth;
            this.mesh.scale.multiplyScalar(scaleFactor);
            this.textMesh.scale.multiplyScalar(scaleFactor);
        }
    }

    updateHealthText() {
        const ctx = this.textContext;
        ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${this.textCanvas.height * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 15;
        
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
            // Also remove the text mesh from the scene
            this.game.scene.remove(this.textMesh);
            
            // Dispose of Three.js resources to prevent memory leaks
            this.mesh.geometry.dispose();
            if(this.mesh.material.map) this.mesh.material.map.dispose();
            this.mesh.material.dispose();
            this.textMesh.geometry.dispose();
            this.textMesh.material.dispose();
            this.textTexture.dispose();
            this.mesh = null;
        }
    }
}