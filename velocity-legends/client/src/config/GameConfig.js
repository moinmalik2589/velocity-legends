import Phaser from 'phaser';

export const gameConfig = {
    type: Phaser.AUTO,

    parent: 'game',

    backgroundColor: '#0B1220',

    width: 1280,
    height: 720,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },

    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
    },

    fps: {
        target: 60,
        forceSetTimeOut: true
    }
};