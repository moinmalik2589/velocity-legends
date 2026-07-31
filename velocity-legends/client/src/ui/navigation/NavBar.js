import { UIFactory } from "../utils/UIFactory.js";

export class NavBar {

    constructor(scene, active = "") {

        this.scene = scene;

        this.background = scene.add.rectangle(
            scene.centerX(),
            scene.screenHeight() - 40,
            scene.screenWidth(),
            80,
            0x111827
        );

        this.background.setStrokeStyle(2, 0x00D4FF);

        this.createButton("HOME", 180, "MainMenuScene", active);
        this.createButton("GARAGE", 420, "GarageScene", active);
        this.createButton("CAREER", 660, null, active);
        this.createButton("SHOP", 900, null, active);

    }

    createButton(text, x, targetScene, active) {

        const button = UIFactory.createButton(
            this.scene,
            x,
            this.scene.screenHeight() - 40,
            text,
            () => {

                if (targetScene) {

                    this.scene.scene.start(targetScene);

                }

            }
        );

        if (text === active) {

            button.background.setFillStyle(0x43A047);

        }

    }

}