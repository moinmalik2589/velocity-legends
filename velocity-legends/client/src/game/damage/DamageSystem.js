export class DamageSystem {

    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.health = 100;

        this.label = scene.add.text(20, 166, "", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "18px", color: "#DDEBFF", fontStyle: "bold"
        }).setScrollFactor(0);
        this.graphics = scene.add.graphics().setScrollFactor(0);
        this.warning = scene.add.text(20, 218, "", {
            fontFamily: "Trebuchet MS, Arial, sans-serif", fontSize: "15px", color: "#FF8D94", fontStyle: "bold"
        }).setScrollFactor(0);
        this.updateLabel();
    }

    hit(amount = 6) {
        this.health = Math.max(0, this.health - amount);
        this.updateLabel();
    }

    repair() {
        this.health = 100;
        this.updateLabel();
    }

    updateLabel() {
        const color = this.health > 55 ? 0x50d88a : this.health > 25 ? 0xffc95a : 0xff6671;
        this.label.setText(`INTEGRITY  ${this.health}%`);
        this.warning.setText(this.health <= 25 ? "CAUTION: CAR DAMAGED" : "");
        this.graphics.clear();
        this.graphics.fillStyle(0x0a1628, 0.85).fillRoundedRect(20, 192, 190, 16, 6);
        this.graphics.fillStyle(color).fillRoundedRect(22, 194, 186 * this.health / 100, 12, 4);
        this.graphics.lineStyle(1, 0xaac8e9, 0.65).strokeRoundedRect(20, 192, 190, 16, 6);
    }
}
