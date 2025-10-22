import Particle from 'particle';

export default class EffectManager {
    constructor(game) {
        this.game = game;
    }

    createShatterEffect(source) {
        const PARTICLE_COUNT = 30;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const x = source.x + Math.random() * source.width;
            const y = source.y + Math.random() * source.height;
            this.game.particles.push(new Particle(this.game, x, y));
        }
    }
    
    createMonsterExplosionEffect(monster) {
        const PARTICLE_COUNT = 40;
        const centerX = monster.x + monster.width / 2;
        const centerY = monster.y + monster.height / 2;
        const colors = ['#8BC34A', '#4CAF50', '#CDDC39', '#C0CA33']; // Shades of slime green

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            const speedX = Math.cos(angle) * speed;
            const speedY = Math.sin(angle) * speed;

            this.game.particles.push(new Particle(this.game, centerX, centerY, {
                speedX: speedX,
                speedY: speedY,
                size: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                gravity: 0.05,
                lifespan: Math.random() * 40 + 30
            }));
        }
    }
}