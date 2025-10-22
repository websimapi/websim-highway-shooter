const maskCache = new Map();
const ALPHA_THRESHOLD = 128; // Pixels with alpha > this are considered solid

// This function creates a simplified data structure (a 2D array of booleans)
// representing the opaque parts of an image. It's cached so we only do this
// expensive operation once per image asset.
export function generateMask(image) {
    if (maskCache.has(image.src)) {
        return;
    }

    if (!image.complete || image.naturalWidth === 0) {
        console.warn("Attempted to generate mask for an image that is not fully loaded:", image.src);
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const mask = [];

    for (let y = 0; y < canvas.height; y++) {
        mask[y] = [];
        for (let x = 0; x < canvas.width; x++) {
            const alpha = imageData[(y * canvas.width + x) * 4 + 3];
            mask[y][x] = alpha > ALPHA_THRESHOLD;
        }
    }
    maskCache.set(image.src, mask);
}

export function getMask(image) {
    return maskCache.get(image.src);
}