import Phaser from "phaser";

export class NitroPickup {

    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.collected = false;

        this.glow = scene.add.circle(x, y, 42, 0x00bfff, 0.14).setDepth(15);
        this.ring = scene.add.circle(x, y, 32, 0x00e5ff, 0).setStrokeStyle(3, 0x7cf4ff, 0.9).setDepth(16);
        this.sprite = scene.add.circle(x, y, 19, 0x00dfff).setStrokeStyle(3, 0xffffff, 0.9).setDepth(17);
        this.icon = scene.add.text(x, y, "+", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "30px", fontStyle: "bold", color: "#FFFFFF"
        }).setOrigin(0.5).setDepth(18);

        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        this.body.setImmovable(true);

        scene.tweens.add({ targets: [this.glow, this.ring], scale: 1.25, alpha: 0.35, duration: 620, yoyo: true, repeat: -1 });
        scene.tweens.add({ targets: this.icon, y: y - 7, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }

    collect(player) {
        if (this.collected) return;
        this.collected = true;
        this.body.enable = false;

        const gain = 35;
        player.nitro.currentNitro = Math.min(player.nitro.maxNitro, player.nitro.currentNitro + gain);
        this.burst();
        this.scene.cameras.main.flash(55, 72, 220, 255, false);

        const label = this.scene.add.text(this.x, this.y - 45, `+${gain} NITRO`, {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "22px", fontStyle: "bold", color: "#8BF5FF"
        }).setOrigin(0.5).setDepth(30);
        this.scene.tweens.add({ targets: label, y: this.y - 105, alpha: 0, duration: 700, onComplete: () => label.destroy() });
        [this.glow, this.ring, this.sprite, this.icon].forEach(item => item.destroy());
    }

    burst() {
        for (let i = 0; i < 16; i++) {
            const particle = this.scene.add.circle(this.x, this.y, Phaser.Math.Between(3, 6), 0x86f7ff).setDepth(25);
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Phaser.Math.Between(-85, 85),
                y: this.y + Phaser.Math.Between(-85, 85),
                alpha: 0,
                scale: 0.25,
                duration: 420,
                onComplete: () => particle.destroy()
            });
        }
    }
}
