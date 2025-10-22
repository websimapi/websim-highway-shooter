import * as THREE from 'three';

export default class Particle {
    constructor(game, x, y, options = {}) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = options.size || Math.random() * 5 + 2;
        this.speedX = options.speedX !== undefined ? options.speedX : Math.random() * 6 - 3; // -3 to 3
        this.speedY = options.speedY !== undefined ? options.speedY : Math.random() * 6 - 3; // -3 to 3
        this.gravity = options.gravity !== undefined ? options.gravity : 0.1;
        this.lifespan = options.lifespan || Math.random() * 50 + 50; // frames/updates
        this.lifeTimer = this.lifespan;
        this.active = true;
        this.color = options.color || `rgba(100, 200, 255, ${Math.random() * 0.5 + 0.5})`;

        const geometry = new THREE.PlaneGeometry(this.size, this.size);
        // Use an array of materials if the color string includes opacity
        const useTransparent = this.color.startsWith('rgba') || (options.color && options.color.length > 7);
        this.material = new THREE.MeshBasicMaterial({ 
            color: this.color,
            transparent: useTransparent,
            opacity: useTransparent ? parseFloat(this.color.split(',')[3]) || 1.0 : 1.0
        });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(
            this.x - this.game.width / 2,
            -this.y + this.game.height / 2,
            4 // Render particles in front of most things
        );
        this.game.scene.add(this.mesh);
    }

    update(deltaTime) {
        // Normalize physics to be consistent regardless of framerate
        const dtFactor = deltaTime / 16.67; // Assuming 60fps is the baseline

        this.speedY += this.gravity * dtFactor;
        this.x += this.speedX * dtFactor;
        this.y += this.speedY * dtFactor;
        this.lifeTimer--;
        
        if (this.lifeTimer <= 0) {
            this.active = false;
            this.destroy();
        } else {
            // Update mesh position
            this.mesh.position.x = this.x - this.game.width / 2;
            this.mesh.position.y = -this.y + this.game.height / 2;

            // Fade out
            if (this.material.transparent) {
                this.material.opacity = (this.lifeTimer / this.lifespan);
            }
        }
    }

    draw(context) {
        // Handled by Three.js
    }

    destroy() {
        if (this.mesh) {
            this.game.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.material.dispose();
            this.mesh = null;
        }
    }
}