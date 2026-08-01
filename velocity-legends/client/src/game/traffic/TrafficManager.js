import Phaser from "phaser";
import { TRACK_WAYPOINTS } from "../track/TrackWaypoints.js";

export class TrafficManager {
    constructor(scene) {
        this.scene = scene;
        this.cars = [this.create(4050, 4400, 0xe8e8e8), this.create(4550, 3050, 0xffa451)];
    }
    create(x, y, color) {
        const sprite = this.scene.physics.add.sprite(x, y, "starter_car").setScale(0.026).setTint(color).setDepth(5);
        sprite.body.setSize(sprite.displayWidth * 0.42, sprite.displayHeight * 0.72);
        return { sprite, waypoint: this.nearestWaypoint(x, y), speed: Phaser.Math.Between(105, 130) };
    }
    nearestWaypoint(x, y) {
        let best = 0, distance = Infinity;
        TRACK_WAYPOINTS.forEach((point, index) => { const d = Phaser.Math.Distance.Between(x, y, point.x, point.y); if (d < distance) { distance = d; best = index; } });
        return best;
    }
    update() {
        this.cars.forEach(car => {
            const target = TRACK_WAYPOINTS[car.waypoint];
            const angle = Phaser.Math.Angle.Between(car.sprite.x, car.sprite.y, target.x, target.y);
            car.sprite.rotation = Phaser.Math.Angle.RotateTo(car.sprite.rotation, angle + Math.PI / 2, 0.035);
            this.scene.physics.velocityFromRotation(car.sprite.rotation - Math.PI / 2, car.speed, car.sprite.body.velocity);
            if (Phaser.Math.Distance.Between(car.sprite.x, car.sprite.y, target.x, target.y) < 75) car.waypoint = (car.waypoint + 1) % TRACK_WAYPOINTS.length;
        });
    }
}
