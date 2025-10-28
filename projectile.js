import * as THREE from 'three';

export default class Projectile {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 20;
        this.speed = 0.8; // pixels per ms
        this.active = true;

        const geometry = new THREE.PlaneGeometry(this.width, this.height);
        const material = new THREE.MeshBasicMaterial({ map: this.game.assets.projectileTexture, transparent: true });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x - this.game.width / 2, this.y * -1 + this.game.height / 2, 1);
        this.game.scene.add(this.mesh);

        // Required for collision detection function
        this.rotation = 0; 
        // this.image is now a getter
    }

    get image() {
        return this.game.assets.projectileImage;
    }

    update(deltaTime) {
        this.y -= this.speed * deltaTime;
        if (this.y < -this.height) {
            this.active = false;
        }
        this.mesh.position.y = this.y * -1 + this.game.height / 2;
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