export class RaceCamera {

    constructor(scene, target) {

        scene.cameras.main.startFollow(
            target
        );

        scene.cameras.main.setZoom(1);

        scene.cameras.main.setBounds(
            0,
            0,
            6000,
            6000
        );

    }

}