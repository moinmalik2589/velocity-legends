import Phaser from "phaser";
import { TRACK_WAYPOINTS } from "../track/TrackWaypoints.js";

export class PositionManager {

    constructor(scene, player, aiCars) {

        this.scene = scene;
        this.player = player;
        this.aiCars = aiCars;

        this.label = scene.add.text(
            scene.scale.width - 20,
            70,
            "",
            {
                fontFamily: "Arial",
                fontSize: "30px",
                color: "#FFD54F",
                fontStyle: "bold"
            }
        );

        this.label
            .setOrigin(1, 0)
            .setScrollFactor(0);

    }

    progress(car) {

        const target =
            TRACK_WAYPOINTS[car.currentWaypoint];

        const distance =
            Phaser.Math.Distance.Between(
                car.sprite.x,
                car.sprite.y,
                target.x,
                target.y
            );

        return (
            car.lap * 100000 +
            car.currentWaypoint * 1000 -
            distance
        );

    }

    update() {

        const racers = [

            this.player,

            ...this.aiCars

        ];

        racers.sort(
            (a, b) =>
                this.progress(b) -
                this.progress(a)
        );

        const pos =
            racers.indexOf(this.player) + 1;

        this.position = pos;

        this.label.setText(
            `POS ${pos}/${racers.length}`
        );

    }

}
