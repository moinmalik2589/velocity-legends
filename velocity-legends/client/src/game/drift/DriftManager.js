export class DriftManager {

    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.score = 0;
        this.combo = 1;
        this.charge = 0;
        this.wasDrifting = false;

        this.label = scene.add.text(scene.scale.width / 2, 18, "", {
            fontFamily: "Trebuchet MS, Arial, sans-serif",
            fontSize: "27px",
            color: "#66E5FF",
            fontStyle: "bold"
        }).setOrigin(0.5, 0).setScrollFactor(0);
    }

    update() {
        const speed = this.player.body.velocity.length();
        const turning = this.player.input.left() || this.player.input.right();
        const drifting = speed > 230 && turning;

        if (drifting) {
            this.charge = Math.min(100, this.charge + 0.7);
            this.combo = Math.min(5, this.combo + 0.012);
            this.score += Math.ceil(this.combo);
            this.label.setColor("#66E5FF");
            this.label.setText(`DRIFT  x${this.combo.toFixed(1)}  •  NITRO +${Math.floor(this.charge)}%`);
        } else if (this.wasDrifting) {
            this.bankCharge();
        } else {
            this.label.setText(this.score > 0 ? `DRIFT SCORE  ${this.score}` : "");
        }

        this.wasDrifting = drifting;
    }

    bankCharge() {
        const gain = Math.floor(this.charge * 0.28);
        if (gain >= 2) {
            this.player.nitro.currentNitro = Math.min(
                this.player.nitro.maxNitro,
                this.player.nitro.currentNitro + gain
            );
            this.label.setColor("#FFD65A");
            this.label.setText(`DRIFT BOOST  +${gain} NITRO`);
            this.scene.cameras.main.flash(60, 102, 229, 255, false);
        }
        this.charge = 0;
        this.combo = 1;
    }
}
