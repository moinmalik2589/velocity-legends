import Phaser from 'phaser';

export class SplashScene extends Phaser.Scene {
    constructor() {
        super('SplashScene');
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#0B1220');

        this.add.text(width / 2, height / 2 - 60, 'VELOCITY', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 10, 'LEGENDS', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#00D4FF',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 70, 'Version 0.1.0', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#B0BEC5'
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            this.scene.start('MainMenuScene');
        });
    }
}