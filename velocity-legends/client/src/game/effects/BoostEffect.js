import Phaser from "phaser";

export class BoostEffect {

    constructor(scene, player) {

        this.scene = scene;
        this.player = player;

        this.particles = [];

        this.wasBoosting = false;

        for (let i = 0; i < 8; i++) {

            const p = scene.add.circle(
                0,
                0,
                2,
                0x00ffff
            );

            p.setDepth(9999);
            p.setBlendMode(Phaser.BlendModes.ADD);
            p.setVisible(false);

            this.particles.push(p);

        }

    }

    update() {

        const notBoosting =
            !this.player.input.nitro() ||
            this.player.nitro.currentNitro <= 0;

        if (notBoosting) {

            this.particles.forEach(p => p.setVisible(false));
            this.wasBoosting = false;
            return;

        }

        const angle =
            this.player.sprite.rotation - Math.PI / 2;

        const rearDistance = this.player.sprite.displayHeight * 0.42;
        const backX = this.player.sprite.x - Math.cos(angle) * rearDistance;
        const backY = this.player.sprite.y - Math.sin(angle) * rearDistance;

        this.wasBoosting = true;

        this.particles.forEach((p, index) => {

            p.setVisible(true);

            p.x =
                backX - Math.cos(angle) * (index % 4) * 4 + Phaser.Math.Between(-4, 4);

            p.y =
                backY - Math.sin(angle) * (index % 4) * 4 + Phaser.Math.Between(-4, 4);

            p.alpha =
                Phaser.Math.FloatBetween(0.4, 1);

            p.setScale(
                Phaser.Math.FloatBetween(0.45, 0.9)
            );

        });

    }

}
