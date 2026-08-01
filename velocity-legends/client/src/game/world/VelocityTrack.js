import Phaser from "phaser";

export class VelocityWorld {

    constructor(scene) {

        this.scene = scene;

    }

    create() {

        const WIDTH = 6000;
        const HEIGHT = 6000;

        // Grass

        this.scene.add.tileSprite(

            WIDTH / 2,
            HEIGHT / 2,

            WIDTH,
            HEIGHT,

            "velocity_grass"

        ).setDepth(-20);

        // Highway

        this.scene.add.tileSprite(

            WIDTH / 2,
            HEIGHT / 2,

            2400,
            5600,

            "velocity_highway"

        ).setDepth(-10);

        // Finish

        this.scene.add.image(

            3000,
            4480,

            "velocity_finish"

        ).setDepth(-5);

    }

}