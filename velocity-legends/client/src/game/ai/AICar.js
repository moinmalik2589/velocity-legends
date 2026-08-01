import Phaser from "phaser";
import { TRACK_WAYPOINTS } from "../track/TrackWaypoints.js";

export class AICar {

    constructor(scene, x, y, color = 0x2196F3) {

        this.scene = scene;

        this.sprite = scene.physics.add.sprite(
            x,
            y,
            "starter_car"
        );

        this.sprite.setOrigin(0.5);
        this.sprite.setScale(0.030);
        this.sprite.setAngle(90);
        this.sprite.setTint(color);
        this.sprite.setDepth(5);

        this.body = this.sprite.body;

        this.body.setCollideWorldBounds(true);

        this.body.setSize(
            this.sprite.displayWidth * 0.42,
            this.sprite.displayHeight * 0.72
        );

        this.speed = 190 + Phaser.Math.Between(-10, 15);

        this.currentWaypoint = 1;
        this.lap = 1;
        this.finished = false;

    }

    update() {

        if (this.finished) return;

        const target =
            TRACK_WAYPOINTS[this.currentWaypoint];

        const angle =
            Phaser.Math.Angle.Between(
                this.sprite.x,
                this.sprite.y,
                target.x,
                target.y
            );

        this.sprite.rotation =
            Phaser.Math.Angle.RotateTo(
                this.sprite.rotation,
                angle + Math.PI / 2,
                0.05
            );

        this.scene.physics.velocityFromRotation(
            this.sprite.rotation - Math.PI / 2,
            this.speed,
            this.body.velocity
        );

        const distance =
            Phaser.Math.Distance.Between(
                this.sprite.x,
                this.sprite.y,
                target.x,
                target.y
            );

        if (distance < 120) {

            this.currentWaypoint++;

            if (
                this.currentWaypoint >=
                TRACK_WAYPOINTS.length
            ) {

                this.currentWaypoint = 0;
                this.lap++;

            }

        }

    }

}
