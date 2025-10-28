// ... existing code ...
    resize(width, height) {
        const oldWidth = this.width;
        const oldHeight = this.height;

        this.width = width;
        this.height = height;
        this.player.resize(oldWidth, oldHeight);

        this.camera.aspect = width / height;
        const fov = 2 * Math.atan((height / 2) / 1000) * (180 / Math.PI);
// ... existing code ...
