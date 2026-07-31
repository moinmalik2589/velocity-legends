export class RaceWorld {

    constructor(scene) {

        this.scene = scene;

        this.width = 6000;
        this.height = 6000;

        scene.physics.world.setBounds(
            0,
            0,
            this.width,
            this.height
        );

    }

    createBackground() {

        const graphics = this.scene.add.graphics();

        graphics.fillStyle(0x2E7D32);

        graphics.fillRect(
            0,
            0,
            this.width,
            this.height
        );

        graphics.lineStyle(2, 0x3FA34D);

        for (let x = 0; x <= this.width; x += 200) {

            graphics.lineBetween(
                x,
                0,
                x,
                this.height
            );

        }

        for (let y = 0; y <= this.height; y += 200) {

            graphics.lineBetween(
                0,
                y,
                this.width,
                y
            );

        }

    }

}