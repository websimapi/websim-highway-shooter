export default class ReplayRecorder {
    constructor(game) {
        this.game = game;
        this.frames = [];
        this.events = [];
        this.startTime = Date.now();
    }

    recordFrame() {
        const currentTime = Date.now() - this.startTime;
        
        const frame = {
            time: currentTime,
            player: {
                x: this.game.player.x,
                y: this.game.player.y,
                rotation: this.game.player.rotation,
                width: this.game.player.width,
                height: this.game.player.height
            },
            projectiles: this.game.projectiles.map(p => ({
                x: p.x,
                y: p.y
            })),
            barrels: this.game.barrels.map(b => ({
                x: b.x,
                y: b.y,
                health: b.health,
                rotation: b.meshRotation,
                width: b.width,
                height: b.height
            })),
            barriers: this.game.barriers.map(b => ({
                x: b.x,
                y: b.y,
                health: b.health,
                width: b.width,
                height: b.height
            })),
            enemies: this.game.enemies.map(e => ({
                x: e.x,
                y: e.y,
                health: e.health,
                scale: e.width / e.baseWidth,
                baseWidth: e.baseWidth,
                baseHeight: e.baseHeight
            })),
            powerups: this.game.powerups.map(p => ({
                x: p.x,
                y: p.y,
                type: p.type
            })),
            particles: this.game.particles.map(p => ({
                x: p.x,
                y: p.y,
                size: p.size,
                color: p.color
            }))
        };

        this.frames.push(frame);

        // No longer limiting duration, so the full replay is available.
    }

    recordEvent(type, data) {
        const currentTime = Date.now() - this.startTime;
        this.events.push({
            time: currentTime,
            type,
            data
        });
    }

    getReplayData() {
        return {
            frames: this.frames,
            events: this.events,
            width: this.game.width,
            height: this.game.height,
            assets: {
                playerShip: 'player_ship.png',
                weapon: 'weapon.png',
                projectile: 'projectile.png',
                barrelTexture: 'barrel_texture.png', // Using the texture for the replay
                barrier: 'barrier.png',
                enemy: 'enemy.png',
                rapidFire: 'rapid_fire.png',
                bomb: 'bomb.png'
            },
            audio: {
                shoot: 'shoot.mp3',
                hit: 'hit.mp3',
                destroy: 'destroy.mp3',
                shatter: 'shatter.mp3',
                bomb_explosion: 'bomb_explosion.mp3',
                bomb_pickup: 'bomb_pickup.mp3'
            }
        };
    }
}