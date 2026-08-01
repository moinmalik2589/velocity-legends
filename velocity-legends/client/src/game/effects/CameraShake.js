export class CameraShake {

    constructor(scene) {

        this.scene = scene;

    }

    small() {

        this.scene.cameras.main.shake(
            120,
            0.004
        );

    }

    medium() {

        this.scene.cameras.main.shake(
            180,
            0.008
        );

    }

    big() {

        this.scene.cameras.main.shake(
            250,
            0.012
        );

    }

}