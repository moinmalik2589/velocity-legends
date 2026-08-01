export class MobileControls {

    constructor(scene) {
        this.scene = scene;
        this.left = false;
        this.right = false;
        this.up = false;
        this.nitro = false;
        // One finger holds GO while another steers or uses nitro.
        scene.input.addPointer(3);
        this.createButtons();
    }

    createButtons() {
        this.button(84, this.scene.scale.height - 88, "<", "left", 0x15335b);
        this.button(186, this.scene.scale.height - 88, ">", "right", 0x15335b);
        this.button(this.scene.scale.width - 186, this.scene.scale.height - 88, "NITRO", "nitro", 0x2a3768, 18);
        this.button(this.scene.scale.width - 84, this.scene.scale.height - 88, "GO", "up", 0x176049, 20);
    }

    button(x, y, label, key, color, fontSize = 32) {
        const circle = this.scene.add.circle(x, y, 42, color, 0.84)
            .setStrokeStyle(2, 0x89cfff, 0.85)
            .setScrollFactor(0)
            .setDepth(15000)
            .setInteractive();
        this.scene.add.text(x, y, label, {
            fontFamily: "Arial", fontSize: `${fontSize}px`, fontStyle: "bold", color: "#FFFFFF"
        }).setOrigin(0.5).setScrollFactor(0).setDepth(15001);
        circle.on("pointerdown", () => { this[key] = true; circle.setScale(0.92); });
        circle.on("pointerup", () => { this[key] = false; circle.setScale(1); });
        circle.on("pointerout", () => { this[key] = false; circle.setScale(1); });
    }

}
