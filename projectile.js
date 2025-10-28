import * as THREE from 'three';

export default class Projectile {
    constructor(game, x, y) {
        this.game = game;
        this.width = 10;
        this.height = 20;
        this.x = x;
        this.y = y;
        this.speed = 1;
        this.active = true;
        this.rotation = 0; // for collision function

        // this.image is now a getter

        // Three.js setup
        const geometry = new THREE.PlaneGeometry(this.width, this.height);
        const material = new THREE.MeshBasicMaterial({ map: this.game.assets.projectileTexture, transparent: true });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(
            this.x + this.width / 2 - this.game.width / 2,
            -this.y - this.height / 2 + this.game.height / 2,
            3 // In front of most things
        );
        this.game.scene.add(this.mesh);
    }

    get image() {
        return this.game.assets.projectileImage;
    }

    update(deltaTime) {
        this.y -= this.speed * deltaTime;
        if (this.y < 0) {
            this.active = false;
        }
        // Sync 3D position
        this.mesh.position.y = -this.y - this.height / 2 + this.game.height / 2;
    }

    draw(context) {
        // Handled by Three.js
    }

    resize(oldGameWidth, oldGameHeight) {
        if (oldGameWidth <= 0 || oldGameHeight <= 0) return;
        const xRatio = (this.x + this.width / 2) / oldGameWidth;
        const yRatio = (this.y + this.height / 2) / oldGameHeight;

        this.x = (this.game.width * xRatio) - (this.width / 2);
        this.y = (this.game.height * yRatio) - (this.height / 2);
        
        this.mesh.position.x = this.x + this.width / 2 - this.game.width / 2;
        this.mesh.position.y = -this.y - this.height / 2 + this.game.height / 2;
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

