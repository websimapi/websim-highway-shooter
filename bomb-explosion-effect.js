import * as THREE from 'three';

export default class BombExplosionEffect {
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
        
        this.mesh.scale.set(progress, progress, 1);
        this.mesh.material.opacity = (1 - progress) * 0.5;
        
        if (this.lifeTimer >= this.duration) {
            this.active = false;
        }
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

