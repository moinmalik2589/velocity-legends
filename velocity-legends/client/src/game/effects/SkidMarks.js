export class SkidMarks {

    constructor(scene, player) {

        this.scene = scene;
        this.player = player;

        this.graphics = scene.add.graphics();

    }

    update() {

        if (Math.abs(this.player.speed) < 180) {

            return;

        }

        this.graphics.fillStyle(0x111111, 0.18);

        this.graphics.fillCircle(
            this.player.sprite.x,
            this.player.sprite.y,
            2
        );

    }

}