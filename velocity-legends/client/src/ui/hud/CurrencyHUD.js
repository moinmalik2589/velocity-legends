import { playerManager } from "../../managers/PlayerManager.js";

export class CurrencyHUD {

    constructor(scene) {

        this.scene = scene;

        this.background = scene.add.rectangle(
            1060,
            50,
            260,
            60,
            0x1A2332
        );

        this.background.setStrokeStyle(2, 0xFFD54F);

        this.text = scene.add.text(
            1060,
            50,
            "",
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: "#FFD54F",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        this.refresh();

    }

    refresh() {

        this.text.setText(
            `Coins: ${playerManager.getCoins().toLocaleString()}`
        );

    }

}