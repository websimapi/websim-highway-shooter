import * as THREE from 'three';

export default class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type; // e.g., 'rapidFire'
        this.width = 40;
        this.height = 40;
        this.speedY = 0.1; // Slower than barrels
        this.active = true;
        this.rotation = 0; // for collision

        let texture;
        if (this.type === 'rapidFire') {
            this.image = this.game.assets.rapidFireImage;
            texture = this.game.assets.rapidFireTexture;
        } else if (this.type === 'bomb') {
            this.image = this.game.assets.bombImage;
            texture = this.game.assets.bombTexture;
        }

        const geometry = new THREE.PlaneGeometry(this.width, this.height);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        this.mesh = new THREE.Mesh(geometry, material);
        this.game.scene.add(this.mesh);
    }

    update(deltaTime) {
        this.y += this.speedY * deltaTime;
        if (this.y > this.game.height) {
            this.active = false;
        }

        this.mesh.position.set(
            this.x - this.game.width / 2,
            -this.y + this.game.height / 2,
            2 // In front of other objects
        );
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