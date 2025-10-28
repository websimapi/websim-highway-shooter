import * as fflate from 'fflate';

// A simple pair of functions to handle base64 encoding/decoding of ArrayBuffers
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

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
                type: e.type,
            })),
            powerups: this.game.powerups.map(p => ({
                x: p.x,
                y: p.y,
                type: p.type
            })),
            // Particles are decorative and create a lot of data. Omitting from replay.
            // particles: this.game.particles.map(p => ({
            //     x: p.x,
            //     y: p.y,
            //     size: p.size,
            //     color: p.color
            // })),
            score: this.game.score,
            bombCount: this.game.player.bombCount
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

    async getReplayData() {
        // Compress the frames data
        const framesString = JSON.stringify(this.frames);
        const compressedFrames = fflate.compressSync(fflate.strToU8(framesString));
        // Convert to base64 to prevent data corruption during prop passing
        const compressedFramesBase64 = arrayBufferToBase64(compressedFrames.buffer);

        const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

        const assetPaths = {
            playerShip: 'player_ship.png',
            weapon: 'weapon.png',
            projectile: 'projectile.png',
            barrelTexture: 'barrel_texture.png',
            barrier: 'barrier.png',
            enemy: 'enemy.png',
            redEnemy: 'red_enemy.png',
            rapidFire: 'rapid_fire.png',
            bomb: 'bomb.png'
        };

        const audioPaths = {
            shoot: 'shoot.mp3',
            hit: 'hit.mp3',
            destroy: 'destroy.mp3',
            shatter: 'shatter.mp3',
            bomb_explosion: 'bomb_explosion.mp3',
            bomb_pickup: 'bomb_pickup.mp3'
        };

        const assetBuffers = {};
        const audioBuffers = {};

        const fetchAsset = async (path) => {
            const response = await fetch(baseUrl + path);
            if (!response.ok) throw new Error(`Failed to fetch asset: ${path}`);
            return await response.arrayBuffer();
        };

        const assetPromises = Object.entries(assetPaths).map(async ([key, path]) => {
            assetBuffers[key] = await fetchAsset(path);
        });

        const audioPromises = Object.entries(audioPaths).map(async ([key, path]) => {
            audioBuffers[key] = await fetchAsset(path);
        });

        await Promise.all([...assetPromises, ...audioPromises]);

        return {
            config: {
                player: {
                    width: this.game.player.width,
                    height: this.game.player.height,
                },
                projectile: {
                    width: 10,
                    height: 20,
                },
                powerup: {
                    width: 40,
                    height: 40,
                },
                enemy: {
                    baseWidth: this.game.width * 0.08,
                    baseHeight: this.game.width * 0.08,
                }
            },
            frames: this.frames,
            events: this.events,
            width: this.game.width,
            height: this.game.height,
            assets: assetBuffers,
            audio: audioBuffers,
            compressedFrames: compressedFramesBase64,
        };
    }
}