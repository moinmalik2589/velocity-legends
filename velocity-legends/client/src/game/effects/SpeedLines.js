import Phaser from "phaser";

export class SpeedLines {

    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.lines = [];

        for (let i = 0; i < 8; i++) {
            const line = scene.add.rectangle(0, 0, 1, Phaser.Math.Between(4, 10), 0xbdefff, 0.65);
            line.setDepth(4).setVisible(false);
            this.lines.push(line);
        }
    }

    update() {
        const speed = this.player.body.velocity.length();
        const boosting = this.player.input.nitro() && this.player.nitro.currentNitro > 0;

        if (speed < 250 && !boosting) {
            this.lines.forEach(line => line.setVisible(false));
            return;
        }

        const rotation = this.player.sprite.rotation;
        const forward = rotation - Math.PI / 2;
        const rearX = this.player.sprite.x - Math.cos(forward) * this.player.sprite.displayHeight * 0.30;
        const rearY = this.player.sprite.y - Math.sin(forward) * this.player.sprite.displayHeight * 0.30;

        this.lines.forEach((line, index) => {
            const side = index % 2 === 0 ? -1 : 1;
            const wheelOffset = this.player.sprite.displayWidth * 0.18 * side;
            const distance = Phaser.Math.Between(3, 14);
            line.setVisible(true);
            line.x = rearX + Math.cos(forward + Math.PI / 2) * wheelOffset - Math.cos(forward) * distance;
            line.y = rearY + Math.sin(forward + Math.PI / 2) * wheelOffset - Math.sin(forward) * distance;
            line.rotation = rotation;
            line.alpha = Phaser.Math.FloatBetween(0.18, boosting ? 0.95 : 0.55);
        });
    }
}
