import { UIButton } from "../components/UIButton.js";
import { UILabel } from "../components/UILabel.js";
import { UIPanel } from "../components/UIPanel.js";

export class UIFactory {

    static createButton(scene, x, y, text, callback) {

        return new UIButton(
            scene,
            x,
            y,
            text,
            callback
        );

    }

    static createLabel(scene, x, y, text, style = {}) {

        return new UILabel(
            scene,
            x,
            y,
            text,
            style
        );

    }

    static createPanel(scene, x, y, width, height) {

        return new UIPanel(
            scene,
            x,
            y,
            width,
            height
        );

    }

}