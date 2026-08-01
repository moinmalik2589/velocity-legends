import { playerManager } from "../../managers/PlayerManager.js";

export class PrizeSystem {

    constructor(positionManager) {

        this.positionManager = positionManager;

    }

    reward() {

        const position = this.positionManager.position;

        let coins = 100;

        switch (position) {

            case 1:
                coins = 1000;
                break;

            case 2:
                coins = 700;
                break;

            case 3:
                coins = 500;
                break;

            default:
                coins = 250;

        }

        playerManager.addCoins(coins);

        return coins;

    }

}