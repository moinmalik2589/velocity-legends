import Phaser from "phaser";
import { TRACK_WAYPOINTS } from "../track/TrackWaypoints.js";

export class RaceProgressManager {

    constructor(scene, player, aiCars, lapManager, raceResults) {

        this.scene = scene;
        this.player = player;
        this.aiCars = aiCars;
        this.lapManager = lapManager;
        this.raceResults = raceResults;

        this.finished = false;

    }

    update() {

        if (this.finished) return;

        const target =
            TRACK_WAYPOINTS[this.player.currentWaypoint];

        const distance =
            Phaser.Math.Distance.Between(
                this.player.sprite.x,
                this.player.sprite.y,
                target.x,
                target.y
            );

        if (distance > 120) return;

        this.player.currentWaypoint++;

        if (
            this.player.currentWaypoint <
            TRACK_WAYPOINTS.length
        ) {

            return;

        }

        this.player.currentWaypoint = 0;

        this.player.lap++;

        const finished =
            this.lapManager.nextLap();

        if (!finished) return;

        this.finished = true;

        this.raceResults.finishRace();

    }

}