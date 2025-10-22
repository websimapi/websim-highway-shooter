import { getMask } from './collisionMask.js';

/**
 * Performs pixel-perfect collision detection between two game objects.
 * It first checks for bounding box collision for performance, then checks
 * for overlapping opaque pixels if the boxes intersect.
 * It correctly handles translation, scaling, and rotation for both objects.
 */
export function checkCollision(obj1, obj2) {
    // Broad phase: Bounding box check (approximated for rotation)
    // This is a simple AABB check and won't be perfectly tight for rotated objects,
    // but it's a fast way to rule out objects that are far apart.
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
        // This is the same check as above, so if we're here, they are intersecting.
        return true; 
    }

    const { cos, sin } = Math;
    const rotation1 = obj1.rotation || 0;
    const rotation2 = obj2.rotation || 0;
    
    const centerX1 = obj1.x + obj1.width / 2;
    const centerY1 = obj1.y + obj1.height / 2;
    const centerX2 = obj2.x + obj2.width / 2;
    const centerY2 = obj2.y + obj2.height / 2;

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

            // --- Transform world coordinates to obj1's local image coordinates ---
            const dx1 = worldX - centerX1;
            const dy1 = worldY - centerY1;
            const rotatedX1 = dx1 * cos(-rotation1) - dy1 * sin(-rotation1);
            const rotatedY1 = dx1 * sin(-rotation1) + dy1 * cos(-rotation1);
            const texX1 = Math.floor((rotatedX1 + obj1.width / 2) / scaleX1);
            const texY1 = Math.floor((rotatedY1 + obj1.height / 2) / scaleY1);

            // --- Transform world coordinates to obj2's local image coordinates ---
            const dx2 = worldX - centerX2;
            const dy2 = worldY - centerY2;
            const rotatedX2 = dx2 * cos(-rotation2) - dy2 * sin(-rotation2);
            const rotatedY2 = dx2 * sin(-rotation2) + dy2 * cos(-rotation2);
            const texX2 = Math.floor((rotatedX2 + obj2.width / 2) / scaleX2);
            const texY2 = Math.floor((rotatedY2 + obj2.height / 2) / scaleY2);

            // Check if the corresponding pixels in both masks are solid
            if (mask1[texY1] && mask1[texY1][texX1] &&
                mask2[texY2] && mask2[texY2][texX2]) {
                return true; // Collision detected
            }
        }
    }

    return false; // No collision
}