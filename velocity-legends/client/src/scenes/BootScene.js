import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Assets will be loaded here in later milestones.
    }

    create() {
        this.scene.start('SplashScene');
    }
}