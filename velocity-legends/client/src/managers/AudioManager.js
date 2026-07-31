class AudioManager {

    constructor() {
        this.scene = null;

        this.musicEnabled = true;
        this.soundEnabled = true;

        this.musicVolume = 1;
        this.soundVolume = 1;
    }

    initialize(scene) {
        this.scene = scene;
    }

    playMusic(key, config = {}) {

        if (!this.scene || !this.musicEnabled) {
            return;
        }

        this.stopMusic();

        this.currentMusic = this.scene.sound.add(key, {
            loop: true,
            volume: this.musicVolume,
            ...config
        });

        this.currentMusic.play();
    }

    stopMusic() {

        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic.destroy();
            this.currentMusic = null;
        }
    }

    playSound(key, config = {}) {

        if (!this.scene || !this.soundEnabled) {
            return;
        }

        this.scene.sound.play(key, {
            volume: this.soundVolume,
            ...config
        });
    }

    setMusicEnabled(value) {
        this.musicEnabled = value;

        if (!value) {
            this.stopMusic();
        }
    }

    setSoundEnabled(value) {
        this.soundEnabled = value;
    }

    setMusicVolume(volume) {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);

        if (this.currentMusic) {
            this.currentMusic.setVolume(this.musicVolume);
        }
    }

    setSoundVolume(volume) {
        this.soundVolume = Phaser.Math.Clamp(volume, 0, 1);
    }
}

export const audioManager = new AudioManager();