import Phaser from "phaser";
import { TRACK_WAYPOINTS } from "../track/TrackWaypoints.js";

export class RoadBoundary {

    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        // The visible road is wide; this keeps the player in it without forcing a single lane.
        this.roadHalfWidth = 72;
    }

    update() {
        const point = this.closestRoadPoint(this.player.sprite.x, this.player.sprite.y);
        const distance = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, point.x, point.y);

        if (distance <= this.roadHalfWidth) return;

        const angle = Phaser.Math.Angle.Between(point.x, point.y, this.player.sprite.x, this.player.sprite.y);
        const clampedX = point.x + Math.cos(angle) * this.roadHalfWidth;
        const clampedY = point.y + Math.sin(angle) * this.roadHalfWidth;
        this.player.sprite.setPosition(clampedX, clampedY);
        this.player.speed *= 0.82;
    }

    closestRoadPoint(x, y) {
        let closest = { x: TRACK_WAYPOINTS[0].x, y: TRACK_WAYPOINTS[0].y };
        let minDistance = Infinity;

        for (let i = 0; i < TRACK_WAYPOINTS.length; i++) {
            const a = TRACK_WAYPOINTS[i];
            const b = TRACK_WAYPOINTS[(i + 1) % TRACK_WAYPOINTS.length];
            const abX = b.x - a.x;
            const abY = b.y - a.y;
            const lengthSquared = abX * abX + abY * abY;
            const t = Phaser.Math.Clamp(((x - a.x) * abX + (y - a.y) * abY) / lengthSquared, 0, 1);
            const candidate = { x: a.x + abX * t, y: a.y + abY * t };
            const distance = Phaser.Math.Distance.Between(x, y, candidate.x, candidate.y);
            if (distance < minDistance) {
                minDistance = distance;
                closest = candidate;
            }
        }
        return closest;
    }
}
