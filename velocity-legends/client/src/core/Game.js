import Phaser from "phaser";

import { gameConfig } from "../config/GameConfig";

import { BootScene } from "../scenes/BootScene";
import { SplashScene } from "../scenes/SplashScene";
import { MainMenuScene } from "../scenes/MainMenuScene";
import { GarageScene } from "../scenes/GarageScene";

import { sceneManager } from "../managers/SceneManager";

export class Game {

    constructor() {

        const config = {

            ...gameConfig,

            scene: [
                BootScene,
                SplashScene,
                MainMenuScene,
                GarageScene
            ]

        };

        this.instance = new Phaser.Game(config);

        sceneManager.initialize(this.instance);

    }

}