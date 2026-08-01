import { TRACK_WAYPOINTS } from "./TrackWaypoints.js";

export class TrackBuilder {

    constructor(scene) {

        this.scene = scene;

    }

    build() {

        const graphics = this.scene.add.graphics();
        const palette = this.scene.raceEvent?.palette || { road: 0x303542, accent: 0xffb14e };

        graphics.lineStyle(190, 0x111622, 1);

        graphics.beginPath();

        graphics.moveTo(
            TRACK_WAYPOINTS[0].x,
            TRACK_WAYPOINTS[0].y
        );

        for (let i = 1; i < TRACK_WAYPOINTS.length; i++) {

            graphics.lineTo(
                TRACK_WAYPOINTS[i].x,
                TRACK_WAYPOINTS[i].y
            );

        }

        graphics.closePath();

        graphics.strokePath();

        graphics.lineStyle(164, palette.road, 1);
        graphics.beginPath();
        graphics.moveTo(TRACK_WAYPOINTS[0].x, TRACK_WAYPOINTS[0].y);
        for (let i = 1; i < TRACK_WAYPOINTS.length; i++) {
            graphics.lineTo(TRACK_WAYPOINTS[i].x, TRACK_WAYPOINTS[i].y);
        }
        graphics.closePath();
        graphics.strokePath();

        // Curbs and dashed lane markings add depth and make the road easier to read at speed.
        for (let i = 0; i < TRACK_WAYPOINTS.length; i++) {
            const a = TRACK_WAYPOINTS[i];
            const b = TRACK_WAYPOINTS[(i + 1) % TRACK_WAYPOINTS.length];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const length = Math.hypot(dx, dy);
            const nx = -dy / length;
            const ny = dx / length;

            for (let d = 18, marker = 0; d < length - 18; d += 54, marker++) {
                const x1 = a.x + dx * d / length;
                const y1 = a.y + dy * d / length;
                const x2 = a.x + dx * Math.min(d + 24, length) / length;
                const y2 = a.y + dy * Math.min(d + 24, length) / length;
                graphics.lineStyle(3, 0xf2f6ff, 0.72).lineBetween(x1, y1, x2, y2);
                const curbColor = marker % 2 === 0 ? palette.accent : 0xf2f6ff;
                graphics.lineStyle(6, curbColor, 0.85)
                    .lineBetween(x1 + nx * 80, y1 + ny * 80, x2 + nx * 80, y2 + ny * 80)
                    .lineBetween(x1 - nx * 80, y1 - ny * 80, x2 - nx * 80, y2 - ny * 80);
            }
        }

        // Racing Line

        graphics.lineStyle(5, palette.accent, 0.6);

        graphics.beginPath();

        graphics.moveTo(
            TRACK_WAYPOINTS[0].x,
            TRACK_WAYPOINTS[0].y
        );

        for (let i = 1; i < TRACK_WAYPOINTS.length; i++) {

            graphics.lineTo(
                TRACK_WAYPOINTS[i].x,
                TRACK_WAYPOINTS[i].y
            );

        }

        graphics.closePath();

        graphics.strokePath();

    }

}
