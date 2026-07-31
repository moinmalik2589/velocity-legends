import { BaseScene } from "./BaseScene.js";

import { UIFactory } from "../ui/utils/UIFactory.js";

import { playerManager } from "../managers/PlayerManager.js";
import { vehicleManager } from "../managers/VehicleManager.js";

import { formatCoins } from "../utils/Helpers.js";

export class MainMenuScene extends BaseScene {

    constructor() {
        super("MainMenuScene");
    }

    create() {

        this.createBackground();

        this.createTitle("VELOCITY LEGENDS");

        const player = playerManager.getData();

        const car = vehicleManager.getSelectedCar();

        UIFactory.createLabel(
            this,
            40,
            40,
            `Coins : ${formatCoins(player.currency.coins)}`,
            {
                fontFamily: "Arial",
                fontSize: "28px",
                color: "#FFD54F"
            }
        );

        UIFactory.createLabel(
            this,
            40,
            80,
            `Current Car : ${car.name}`,
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: "#FFFFFF"
            }
        );

        UIFactory.createButton(
            this,
            this.centerX(),
            this.centerY() - 60,
            "PLAY",
            () => {
                console.log("Race Scene Coming Soon");
            }
        );

        UIFactory.createButton(
            this,
            this.centerX(),
            this.centerY() + 40,
            "GARAGE",
            () => {
                this.scene.start("GarageScene");
            }
        );

        this.createFooter();

    }

}