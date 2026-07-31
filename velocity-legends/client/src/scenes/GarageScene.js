import { BaseScene } from "./BaseScene.js";

import { GarageScreen } from "../ui/screens/GarageScreen.js";

export class GarageScene extends BaseScene {

    constructor() {
        super("GarageScene");
    }

    create() {

        this.createBackground();

        this.screen = new GarageScreen(this);

    }

}