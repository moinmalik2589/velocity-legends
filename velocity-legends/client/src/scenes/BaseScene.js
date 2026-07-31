import Phaser from "phaser";

export class BaseScene extends Phaser.Scene {

    constructor(sceneKey) {
        super(sceneKey);
    }

    createBackground(color = 0x0B1220) {
        this.cameras.main.setBackgroundColor(color);
    }

    createTitle(title) {

        return this.add.text(
            this.scale.width / 2,
            60,
            title,
            {
                fontFamily: "Arial",
                fontSize: "48px",
                color: "#FFFFFF",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

    }

    createFooter(text = "Velocity Legends © 2026") {

        return this.add.text(
            this.scale.width / 2,
            this.scale.height - 30,
            text,
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#90A4AE"
            }
        ).setOrigin(0.5);

    }

    centerX() {
        return this.scale.width / 2;
    }

    centerY() {
        return this.scale.height / 2;
    }

    screenWidth() {
        return this.scale.width;
    }

    screenHeight() {
        return this.scale.height;
    }

}