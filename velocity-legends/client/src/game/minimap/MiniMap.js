export class MiniMap {

    constructor(scene, player, aiCars) {

        this.scene = scene;
        this.player = player;
        this.aiCars = aiCars;

        this.size = 180;

        this.scale = 0.03;

        this.x = scene.scale.width - this.size - 20;

        this.y = scene.scale.height - this.size - 20;

        this.graphics = scene.add.graphics();

        this.graphics.setScrollFactor(0);

    }

    update() {

        this.graphics.clear();

        this.graphics.fillStyle(0x111111, 0.8);

        this.graphics.fillRoundedRect(
            this.x,
            this.y,
            this.size,
            this.size,
            12
        );

        this.graphics.lineStyle(2, 0xffffff);

        this.graphics.strokeRoundedRect(
            this.x,
            this.y,
            this.size,
            this.size,
            12
        );

        this.drawCar(
            this.player.sprite,
            0xff0000
        );

        this.aiCars.forEach(ai => {

            this.drawCar(
                ai.sprite,
                0x00d4ff
            );

        });

    }

    drawCar(sprite, color) {

        const px = this.x + (sprite.x * this.scale);

        const py = this.y + (sprite.y * this.scale);

        this.graphics.fillStyle(color);

        this.graphics.fillCircle(
            px,
            py,
            4
        );

    }

}