import { UIFactory } from "../utils/UIFactory.js";

export class ConfirmationDialog {

    constructor(scene, title, message, onYes, onNo = null) {

        this.scene = scene;

        const centerX = scene.centerX();
        const centerY = scene.centerY();

        this.overlay = scene.add.rectangle(
            centerX,
            centerY,
            scene.screenWidth(),
            scene.screenHeight(),
            0x000000,
            0.65
        );

        this.panel = UIFactory.createPanel(
            scene,
            centerX,
            centerY,
            600,
            300
        );

        UIFactory.createLabel(
            scene,
            centerX,
            centerY - 90,
            title,
            {
                fontFamily: "Arial",
                fontSize: "34px",
                color: "#FFFFFF",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        UIFactory.createLabel(
            scene,
            centerX,
            centerY - 20,
            message,
            {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#FFFFFF",
                align: "center"
            }
        ).setOrigin(0.5);

        UIFactory.createButton(
            scene,
            centerX - 120,
            centerY + 90,
            "YES",
            () => {

                this.destroy();

                if (onYes) {
                    onYes();
                }

            }
        );

        UIFactory.createButton(
            scene,
            centerX + 120,
            centerY + 90,
            "NO",
            () => {

                this.destroy();

                if (onNo) {
                    onNo();
                }

            }
        );

    }

    destroy() {

        this.overlay.destroy();

        this.panel.destroy();

    }

}