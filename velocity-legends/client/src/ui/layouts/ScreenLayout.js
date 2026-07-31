import { UIPanel } from "../components/UIPanel.js";
import { UILabel } from "../components/UILabel.js";

export class ScreenLayout {

    constructor(scene, title) {

        this.scene = scene;

        const width = scene.scale.width;
        const height = scene.scale.height;

        this.background = scene.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x0B1220
        );

        this.header = new UIPanel(
            scene,
            width / 2,
            50,
            width,
            100
        );

        this.title = new UILabel(
            scene,
            width / 2,
            50,
            title,
            {
                fontFamily: "Arial",
                fontSize: "42px",
                color: "#FFFFFF",
                fontStyle: "bold"
            }
        );

        this.title.setOrigin(0.5);

        this.content = new UIPanel(
            scene,
            width / 2,
            height / 2 + 20,
            width - 80,
            height - 180
        );

    }

    destroy() {

        this.background.destroy();
        this.header.destroy();
        this.title.destroy();
        this.content.destroy();

    }

}