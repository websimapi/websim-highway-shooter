import Barrel from 'barrel';
import Barrier from 'barrier';
import Enemy from 'enemy';
import PowerUp from 'powerup';

export default class Spawner {
    constructor(game) {
        this.game = game;
        this.barrelTimer = 0;
        this.barrelInterval = 2000; // ms
        this.enemyTimer = 5000; // Time before first enemy cluster
        this.enemyInterval = 12000; // Time between enemy clusters
        
        this.redEnemySpawnThreshold = 500;
        this.redEnemySpawnInterval = 250;
    }

    update(deltaTime) {
        // Spawn barrels/barriers
        if (this.barrelTimer > this.barrelInterval) {
            this.spawnObstacleGroup();
            this.barrelTimer = 0;
            if (this.barrelInterval > 500) this.barrelInterval *= 0.99;
        } else {
            this.barrelTimer += deltaTime;
        }

        // Spawn enemies
        if (this.enemyTimer > this.enemyInterval) {
            this.spawnEnemyCluster();
            this.enemyTimer = 0;
        } else {
            this.enemyTimer += deltaTime;
        }

        // Spawn Red enemies based on score
        if (this.game.score >= this.redEnemySpawnThreshold) {
            this.spawnRedEnemy();
            this.redEnemySpawnThreshold += this.redEnemySpawnInterval;
        }
    }

    spawnObstacleGroup() {
        // 1 in 10 chance to spawn a barrier instead of barrels
        if (Math.random() < 0.1) {
            this.spawnBarrier();
        } else {
            this.spawnBarrelGroup();
        }
    }

    spawnBarrelGroup() {
        const lane = Math.floor(Math.random() * 3); // Pick one lane for the group
        const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 barrels in the group

        const subLanes = [0, 1, 2];

        // Shuffle subLanes array to pick random positions within the lane
        for (let i = subLanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [subLanes[i], subLanes[j]] = [subLanes[j], subLanes[i]];
        }

        const selectedSubLanes = subLanes.slice(0, count);

        const yOffset = -100; // All barrels in a row start at the same Y, offscreen
        const speed = Math.random() * 0.1 + 0.1; // Common speed for the group

        for (const subLane of selectedSubLanes) {
            this.game.barrels.push(new Barrel(this.game, lane, subLane, yOffset, speed));
        }
    }

    spawnBarrier() {
        const lane = Math.floor(Math.random() * 3);
        this.game.barriers.push(new Barrier(this.game, lane));
    }

    spawnPowerUp(x, y, type) {
        this.game.powerups.push(new PowerUp(this.game, x, y, type));
    }

    spawnEnemyCluster() {
        const CLUSTER_SIZE = 20;
        const lane = Math.floor(Math.random() * 3);
        const laneWidth = this.game.width / 3;
        const laneStartX = lane * laneWidth;

        for (let i = 0; i < CLUSTER_SIZE; i++) {
            // Spawn in a random position within the chosen lane, off-screen
            const x = laneStartX + Math.random() * (laneWidth - this.game.player.width);
            const y = -100 - Math.random() * 300; // Stagger their vertical start
            this.game.enemies.push(new Enemy(this.game, x, y));
        }
    }

    spawnRedEnemy() {
        // Spawn in a random position at the top, off-screen
        const x = Math.random() * (this.game.width - this.game.player.width);
        const y = -150;
        this.game.enemies.push(new Enemy(this.game, x, y, 'red'));
    }
}