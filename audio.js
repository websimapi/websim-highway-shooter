export default class AudioPlayer {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.loadSounds();
    }

    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[name] = audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound: ${name}`, error);
        }
    }

    loadSounds() {
        this.loadSound('shoot', 'shoot.mp3');
        this.loadSound('hit', 'hit.mp3');
        this.loadSound('destroy', 'destroy.mp3');
        this.loadSound('shatter', 'shatter.mp3');
    }

    play(name) {
        if (!this.sounds[name] || this.audioContext.state === 'suspended') return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.connect(this.audioContext.destination);
        source.start(0);
    }
    
    resumeContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}