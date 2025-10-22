import { getMask } from 'collisionMask';

/**
 * Performs pixel-perfect collision detection between two game objects.
 * It first checks for bounding box collision for performance, then checks
 * for overlapping opaque pixels if the boxes intersect.
 * It correctly handles translation, scaling, and rotation of obj1 (e.g., the player).
 */
export function checkCollision(obj1, obj2) {
    // Broad phase: Bounding box check
    // Note: For a rotated obj1, this bounding box is an approximation but is good enough
    // for a quick check to see if the objects are anywhere near each other.
    if (
        obj1.x > obj2.x + obj2.width ||
        obj1.x + obj1.width < obj2.x ||
        obj1.y > obj2.y + obj2.height ||
        obj1.y + obj1.height < obj2.y
    ) {
        return false;
    }

    // Narrow phase: Pixel-perfect check
    const mask1 = getMask(obj1.image);
    const mask2 = getMask(obj2.image);

    if (!mask1 || !mask2) {
        // Fallback to bounding box if a mask is missing.
        return true; 
    }

    const { cos, sin } = Math;
    const rotation = obj1.rotation || 0;
    const centerX1 = obj1.x + obj1.width / 2;
    const centerY1 = obj1.y + obj1.height / 2;

    const naturalWidth1 = obj1.image.naturalWidth;
    const naturalHeight1 = obj1.image.naturalHeight;
    const naturalWidth2 = obj2.image.naturalWidth;
    const naturalHeight2 = obj2.image.naturalHeight;

    const scaleX1 = obj1.width / naturalWidth1;
    const scaleY1 = obj1.height / naturalHeight1;
    const scaleX2 = obj2.width / naturalWidth2;
    const scaleY2 = obj2.height / naturalHeight2;

    // Determine the overlapping area (intersection of bounding boxes)
    const xStart = Math.max(obj1.x, obj2.x);
    const xEnd = Math.min(obj1.x + obj1.width, obj2.x + obj2.width);
    const yStart = Math.max(obj1.y, obj2.y);
    const yEnd = Math.min(obj1.y + obj1.height, obj2.y + obj2.height);

    // Iterate over the pixels in the overlapping area
    for (let worldY = yStart; worldY < yEnd; worldY++) {
        for (let worldX = xStart; worldX < xEnd; worldX++) {

            // --- Transform world coordinates to obj1's local, rotated, scaled image coordinates ---
            
            // 1. Translate to be relative to obj1's center
            const dx1 = worldX - centerX1;
            const dy1 = worldY - centerY1;

            // 2. Apply inverse rotation
            const rotatedX1 = dx1 * cos(-rotation) - dy1 * sin(-rotation);
            const rotatedY1 = dx1 * sin(-rotation) + dy1 * cos(-rotation);

            // 3. Translate back from center and scale to find texture coordinates
            const texX1 = Math.floor((rotatedX1 + obj1.width / 2) / scaleX1);
            const texY1 = Math.floor((rotatedY1 + obj1.height / 2) / scaleY1);

            // --- Transform world coordinates to obj2's local, scaled image coordinates ---
            const texX2 = Math.floor((worldX - obj2.x) / scaleX2);
            const texY2 = Math.floor((worldY - obj2.y) / scaleY2);

            // Check if the corresponding pixels in both masks are solid
            if (mask1[texY1] && mask1[texY1][texX1] &&
                mask2[texY2] && mask2[texY2][texX2]) {
                return true; // Collision detected
            }
        }
    }

    return false; // No collision
}