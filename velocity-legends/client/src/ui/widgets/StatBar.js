export class StatBar {

    constructor(scene, x, y, width, value, color = 0x00D4FF) {

        this.scene = scene;

        this.background = scene.add.rectangle(
            x,
            y,
            width,
            12,
            0x303030
        ).setOrigin(0, 0.5);

        this.fill = scene.add.rectangle(
            x,
            y,
            width * Phaser.Math.Clamp(value / 100, 0, 1),
            12,
            color
        ).setOrigin(0, 0.5);

    }

    setValue(value) {

        this.fill.width = this.background.width *
            Phaser.Math.Clamp(value / 100, 0, 1);

    }

    destroy() {

        this.background.destroy();
        this.fill.destroy();

    }

}