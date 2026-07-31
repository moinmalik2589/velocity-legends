export class PlayerCar {

    constructor(scene, x, y) {

        this.scene = scene;

        this.sprite = scene.add.rectangle(
            x,
            y,
            60,
            120,
            0xff0000
        );

        scene.physics.add.existing(this.sprite);

        this.body = this.sprite.body;

        this.body.setCollideWorldBounds(true);

    }

}