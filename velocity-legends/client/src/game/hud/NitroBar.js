export class NitroBar {

    constructor(scene, player) {

        this.scene = scene;
        this.player = player;

        this.graphics = scene.add.graphics();

        this.graphics.setScrollFactor(0);

    }

    update() {

        this.graphics.clear();

        const width = 250;
        const height = 20;

        const x = 20;
        const y = this.scene.scale.height - 35;

        this.graphics.lineStyle(2, 0x9cdcff);

        this.graphics.strokeRect(
            x,
            y,
            width,
            height
        );

        this.graphics.fillStyle(0x00d4ff);

        this.graphics.fillRect(
            x,
            y,
            width * (this.player.nitro.currentNitro / this.player.nitro.maxNitro),
            height
        );

        this.graphics.fillStyle(0xffffff, 0.28);
        this.graphics.fillRect(x, y, width * (this.player.nitro.currentNitro / this.player.nitro.maxNitro), 4);

    }

}
