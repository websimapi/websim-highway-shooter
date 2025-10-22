export default class Barrel {
    constructor(game, lane, subLane, yOffset = 0, speed = null) {
        this.game = game;
        this.lane = lane;
        this.subLane = subLane;

        const laneWidth = this.game.width / 3;
        const subLaneWidth = laneWidth / 3;

        // Make barrels smaller to fit 3 in a lane.
        this.width = subLaneWidth * 0.85;
        this.height = this.width;
        
        const laneStartX = lane * laneWidth;
        
        this.x = laneStartX + (subLane * subLaneWidth) + (subLaneWidth / 2) - (this.width / 2);
        
        this.y = yOffset; // Start at the given yOffset
        this.speedY = speed !== null ? speed : Math.random() * 0.1 + 0.1;
        this.maxHealth = Math.floor(Math.random() * 5) + 1;
        this.health = this.maxHealth;
        this.active = true;
        this.rotation = 0; // Required for collision detection function
        
        // Power-up logic
        this.hasPowerUp = Math.random() < 0.1; // 10% chance
        this.powerUpType = 'rapidFire'; // For now, only one type
        
        this.image = new Image();
        this.image.src = 'barrel.png';
    }

    update(deltaTime) {
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
    }

    draw(context) {
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
        
        // Draw health number
        context.fillStyle = 'white';
        context.font = `${this.width * 0.5}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.health, this.x + this.width / 2, this.y + this.height / 2);
    }

    hit() {
        this.health--;
        if (this.health <= 0) {
            this.active = false;
        }
    }
}